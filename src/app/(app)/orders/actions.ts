"use server";

import { Order, PaymentMethod, PaymentStatus, ShippingStatus, OrderRemark } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";
import { createInventoryLog } from "@/lib/inventory-log-helper";

export async function getOrders(): Promise<Order[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const isSuperAdmin = user.role?.name === 'Super Admin';

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      batch: true,
    }
  });

  // Filter orders based on user role
  const filteredOrders = isSuperAdmin
    ? orders
    : orders.filter(order => {
      if (!(order as any).createdBy) return false;
      const createdByData = (order as any).createdBy as any;
      return createdByData?.uid === user.id;
    });

  return filteredOrders.map(order => ({
    id: order.id,
    customerName: order.customerName,
    contactNumber: order.contactNumber || "",
    address: order.address || "",
    orderDate: order.orderDate ? order.orderDate.toISOString().split('T')[0] : "",
    itemName: order.itemName,
    items: (order as any).items ? (typeof (order as any).items === 'string' ? JSON.parse((order as any).items) : (order as any).items) : [],
    quantity: order.quantity,
    price: order.price,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    paymentMethod: (order.paymentMethod as PaymentMethod) || "COD",
    paymentStatus: (order.paymentStatus as PaymentStatus) || "Unpaid",
    shippingStatus: (order.shippingStatus as ShippingStatus) || "Pending",
    batchId: order.batchId,
    createdAt: order.createdAt,
    createdBy: (order.createdBy as any) || { uid: "system", name: "System" },
    customerId: order.customerId,
    customerEmail: order.customerEmail || "",
    courierName: order.courierName || "",
    trackingNumber: order.trackingNumber || "",
    remarks: ((order.remarks || "") as OrderRemark),
    rushShip: order.rushShip,
    batch: order.batch ? {
      ...order.batch,
      manufactureDate: (order.batch as any).manufactureDate.toISOString(),
      status: order.batch.status as any,
      totalOrders: order.batch.totalOrders || 0,
      totalSales: order.batch.totalSales || 0,
    } : undefined,
  }));
}

export async function getAllOrders(): Promise<{ orders: Order[], isAuthorized: boolean }> {
  const user = await getCurrentUser();

  if (!user) {
    return { orders: [], isAuthorized: false };
  }

  // Restrict only Staff role
  const isStaff = user.role?.name.toLowerCase() === 'staff';
  if (isStaff) {
    return { orders: [], isAuthorized: false };
  }

  // Fetch ALL orders regardless of creator
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      batch: true,
    }
  });

  const mapOrders = orders.map(order => ({
    id: order.id,
    customerName: order.customerName,
    contactNumber: order.contactNumber || "",
    address: order.address || "",
    orderDate: order.orderDate ? order.orderDate.toISOString().split('T')[0] : "",
    itemName: order.itemName,
    items: (order as any).items ? (typeof (order as any).items === 'string' ? JSON.parse((order as any).items) : (order as any).items) : [],
    quantity: order.quantity,
    price: order.price,
    shippingFee: order.shippingFee,
    totalAmount: order.totalAmount,
    paymentMethod: (order.paymentMethod as PaymentMethod) || "COD",
    paymentStatus: (order.paymentStatus as PaymentStatus) || "Unpaid",
    shippingStatus: (order.shippingStatus as ShippingStatus) || "Pending",
    batchId: order.batchId,
    createdAt: order.createdAt,
    createdBy: (order.createdBy as any) || { uid: "system", name: "System" },
    customerId: order.customerId,
    customerEmail: order.customerEmail || "",
    courierName: order.courierName || "",
    trackingNumber: order.trackingNumber || "",
    remarks: ((order.remarks || "") as OrderRemark),
    rushShip: order.rushShip,
    batch: order.batch ? {
      ...order.batch,
      manufactureDate: (order.batch as any).manufactureDate.toISOString(),
      status: order.batch.status as any,
      totalOrders: order.batch.totalOrders || 0,
      totalSales: order.batch.totalSales || 0,
    } : undefined,
  }));

  return { orders: mapOrders, isAuthorized: true };
}

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'> & { items?: any[] }): Promise<Order> {
  try {
    const user = await getCurrentUser();
    const createdBy = user ? {
      uid: user.id, // Match the 'uid' expected by types and filter
      id: user.id,  // Also store 'id' for clarity
      name: user.name,
      email: user.email
    } : { uid: "system", name: "System" };

    const orderId = `o${Math.random().toString(36).substring(2, 15)}`;
    const now = new Date();

    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Create the order using raw SQL to bypass Prisma client validation
      await tx.$executeRawUnsafe(
        `INSERT INTO orders (id, customerName, contactNumber, address, orderDate, itemName, items, quantity, price, shippingFee, totalAmount, paymentMethod, paymentStatus, shippingStatus, batchId, createdAt, updatedAt, customerId, customerEmail, courierName, trackingNumber, remarks, rushShip, createdBy) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orderId,
        orderData.customerName,
        orderData.contactNumber || null,
        orderData.address || null,
        orderData.orderDate ? new Date(orderData.orderDate) : null,
        orderData.itemName,
        orderData.items ? JSON.stringify(orderData.items) : null,
        orderData.quantity,
        orderData.price,
        orderData.shippingFee,
        orderData.totalAmount,
        orderData.paymentMethod,
        orderData.paymentStatus,
        orderData.shippingStatus,
        orderData.batchId,
        now,
        now,
        orderData.customerId,
        orderData.customerEmail || null,
        orderData.courierName || null,
        orderData.trackingNumber || null,
        orderData.remarks || null,
        orderData.rushShip ? 1 : 0,
        JSON.stringify(createdBy)
      );

      // 2. Deduct from inventory if items are provided
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          const productId = item.product.id;
          const quantityToDeduct = item.quantity;

          // Deduced from quantity (Main Inventory) regardless of remark, as branches are merged
          const updateData = { quantity: { decrement: quantityToDeduct } };

          const updatedProduct = await tx.product.update({
            where: { id: productId },
            data: updateData,
            select: { id: true, name: true, quantity: true, alertStock: true, retailPrice: true }
          });

          // 3. Create notifications if stock is low or out
          const totalStock = updatedProduct.quantity;
          if (totalStock <= 0 || totalStock <= updatedProduct.alertStock) {
            const notifId = `n${Math.random().toString(36).substring(2, 15)}`;
            const title = totalStock <= 0 ? "Out of Stock Alert" : "Low Stock Alert";
            const message = totalStock <= 0
              ? `Product "${updatedProduct.name}" is now out of stock!`
              : `Product "${updatedProduct.name}" has only ${totalStock} left in stock.`;
            const type = totalStock <= 0 ? "out_of_stock" : "low_stock";

            await tx.$executeRawUnsafe(
              `INSERT INTO notifications (id, title, message, type, \`read\`, createdAt, updatedAt) VALUES (?, ?, ?, ?, 0, ?, ?)`,
              notifId, title, message, type, now, now
            );
          }

          // Log inventory change
          const previousStock = updatedProduct.quantity + quantityToDeduct;
          await createInventoryLog({
            action: "SOLD",
            productId: productId,
            quantityChange: -quantityToDeduct,
            previousStock: previousStock,
            newStock: updatedProduct.quantity,
            reason: `Order #${orderId.substring(0, 8)}`,
            referenceId: orderId,
            orderId: orderId,
            branchId: user?.branchId || null,
          }, tx, user);
        }
      }

      // Update Batch Totals for Delivered orders
      const isValidBatchId = (bid: string | null | undefined) => bid && bid !== 'none' && bid !== 'hold';
      if (orderData.shippingStatus === 'Delivered' && isValidBatchId(orderData.batchId)) {
        const targetBatchId = orderData.batchId!;
        const batch = await tx.batch.findUnique({ where: { id: targetBatchId } });
        if (batch) {
          await tx.batch.update({
            where: { id: targetBatchId },
            data: {
              totalOrders: (batch.totalOrders || 0) + 1,
              totalSales: (batch.totalSales || 0) + orderData.totalAmount
            }
          });
          console.log(`[BatchUpdate] Updated Batch ${targetBatchId}: Orders +1, Sales +${orderData.totalAmount}`);
        } else {
          console.warn(`[BatchUpdate] Batch ${targetBatchId} not found!`);
        }
      }

      // 4. Create Sales Log (Raw SQL)
      const logId = `sl${Math.random().toString(36).substring(2, 15)}`;
      const ordersJson = JSON.stringify({
        id: orderId,
        orderDate: orderData.orderDate,
        paymentStatus: orderData.paymentStatus,
        paymentMethod: orderData.paymentMethod,
        shippingStatus: orderData.shippingStatus,
        createdBy: createdBy
      });
      const shipmentsJson = JSON.stringify({
        address: orderData.address,
        courier: orderData.courierName,
        tracking: orderData.trackingNumber,
        shippingFee: orderData.shippingFee
      });
      const orderItemsJson = orderData.items ? JSON.stringify(orderData.items) : null;

      await tx.$executeRawUnsafe(
        `INSERT INTO sales_logs (id, orderId, description, products, orders, customerName, totalAmount, shipments, order_items, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        logId,
        orderId,
        "Order Created",
        orderData.itemName,
        ordersJson,
        orderData.customerName,
        orderData.totalAmount,
        shipmentsJson,
        orderItemsJson,
        now
      );

      return { id: orderId, createdAt: now };
    }, { timeout: 15000 });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    revalidatePath("/batches");
    return {
      ...orderData,
      id: newOrder.id,
      createdAt: newOrder.createdAt,
      createdBy: createdBy // Return correct creator
    };
  } catch (error: any) {
    console.error("CRITICAL ERROR in createOrder:", error);
    throw new Error(error.message || "Failed to create order due to a server error.");
  }
}



export async function updateOrder(id: string, data: Partial<Order>): Promise<Order> {
  try {
    const updatedOrderResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch existing order to revert its effects on batches if needed
      const existingOrder = await tx.order.findUnique({ where: { id } });
      if (!existingOrder) throw new Error("Order not found");

      // 2. Manage Batch Totals based on shippingStatus (Delivered only)
      const wasCountable = existingOrder.shippingStatus === 'Delivered';
      const isNowCountable = data.shippingStatus === 'Delivered';

      const oldBatchId = existingOrder.batchId;
      const newBatchId = data.batchId !== undefined ? data.batchId : oldBatchId;

      const oldAmount = existingOrder.totalAmount;
      const newAmount = data.totalAmount !== undefined ? data.totalAmount : oldAmount;

      const batchChanged = oldBatchId !== newBatchId;
      const amountChanged = oldAmount !== newAmount;
      const statusChanged = (data.shippingStatus !== undefined && existingOrder.shippingStatus !== data.shippingStatus);

      // Helper to check if batch is valid for stats
      const isValidBatch = (bid: string | null) => bid && bid !== 'none' && bid !== 'hold';

      if (wasCountable && !isNowCountable) {
        // Condition 1: Transition FROM Countable TO non-Countable (Cancelled) -> Revert stats
        if (isValidBatch(oldBatchId)) {
          const batch = await tx.batch.findUnique({ where: { id: oldBatchId! } });
          if (batch) {
            await tx.batch.update({
              where: { id: oldBatchId! },
              data: {
                totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
                totalSales: Math.max(0, (batch.totalSales || 0) - oldAmount)
              }
            });
          }
        }
      } else if (!wasCountable && isNowCountable) {
        // Condition 2: Transition FROM non-Countable TO Countable -> Apply stats
        if (isValidBatch(newBatchId)) {
          const batch = await tx.batch.findUnique({ where: { id: newBatchId! } });
          if (batch) {
            await tx.batch.update({
              where: { id: newBatchId! },
              data: {
                totalOrders: (batch.totalOrders || 0) + 1,
                totalSales: (batch.totalSales || 0) + newAmount
              }
            });
          }
        }
      } else if (wasCountable && isNowCountable) {
        // Condition 3: Stayed Countable but Batch or Amount changed -> Diff stats
        if (batchChanged) {
          // Revert old
          if (isValidBatch(oldBatchId)) {
            const batch = await tx.batch.findUnique({ where: { id: oldBatchId! } });
            if (batch) {
              await tx.batch.update({
                where: { id: oldBatchId! },
                data: {
                  totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
                  totalSales: Math.max(0, (batch.totalSales || 0) - oldAmount)
                }
              });
            }
          }
          // Apply new
          if (isValidBatch(newBatchId)) {
            const batch = await tx.batch.findUnique({ where: { id: newBatchId! } });
            if (batch) {
              await tx.batch.update({
                where: { id: newBatchId! },
                data: {
                  totalOrders: (batch.totalOrders || 0) + 1,
                  totalSales: (batch.totalSales || 0) + newAmount
                }
              });
            }
          }
        } else if (amountChanged) {
          // Same batch, different amount
          if (isValidBatch(newBatchId)) {
            const batch = await tx.batch.findUnique({ where: { id: newBatchId! } });
            if (batch) {
              await tx.batch.update({
                where: { id: newBatchId! },
                data: {
                  totalSales: (batch.totalSales || 0) + (newAmount - oldAmount)
                }
              });
            }
          }
        }
      }

      // 3. Update the order
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          customerName: data.customerName,
          contactNumber: data.contactNumber,
          address: data.address,
          orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
          itemName: data.itemName,
          quantity: data.quantity,
          price: data.price,
          shippingFee: data.shippingFee,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus,
          shippingStatus: data.shippingStatus,
          batchId: data.batchId,
          customerId: data.customerId,
          customerEmail: data.customerEmail,
          courierName: data.courierName,
          trackingNumber: data.trackingNumber,
          remarks: data.remarks,
          rushShip: data.rushShip,
          createdBy: data.createdBy as any,
          items: data.items ? JSON.stringify(data.items) : undefined,
        },
      });

      // Create Sales Log (omitted for brevity, copied from original)
      // ...
      const now = new Date();
      const logId = `sl${Math.random().toString(36).substring(2, 15)}`;
      // Parse items if string
      const items = (updatedOrder as any).items ? (typeof (updatedOrder as any).items === 'string' ? JSON.parse((updatedOrder as any).items) : (updatedOrder as any).items) : [];

      const ordersJson = JSON.stringify({
        id: updatedOrder.id,
        orderDate: updatedOrder.orderDate,
        paymentStatus: updatedOrder.paymentStatus,
        paymentMethod: updatedOrder.paymentMethod,
        shippingStatus: updatedOrder.shippingStatus,
        createdBy: (updatedOrder as any).createdBy
      });
      const shipmentsJson = JSON.stringify({
        address: updatedOrder.address,
        courier: updatedOrder.courierName,
        tracking: updatedOrder.trackingNumber,
        shippingFee: updatedOrder.shippingFee
      });
      const orderItemsJson = JSON.stringify(items);

      await tx.$executeRawUnsafe(
        `INSERT INTO sales_logs (id, orderId, description, products, orders, customerName, totalAmount, shipments, order_items, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        logId,
        updatedOrder.id,
        "Order Updated",
        updatedOrder.itemName,
        ordersJson,
        updatedOrder.customerName,
        updatedOrder.totalAmount,
        shipmentsJson,
        orderItemsJson,
        now
      );



      return updatedOrder;
    });

    revalidatePath("/orders");
    revalidatePath("/customers");
    revalidatePath("/batches");

    return {
      id: updatedOrderResult.id,
      customerName: updatedOrderResult.customerName,
      contactNumber: updatedOrderResult.contactNumber || "",
      address: updatedOrderResult.address || "",
      orderDate: updatedOrderResult.orderDate ? updatedOrderResult.orderDate.toISOString().split('T')[0] : "",
      itemName: updatedOrderResult.itemName,
      quantity: updatedOrderResult.quantity,
      price: updatedOrderResult.price,
      shippingFee: updatedOrderResult.shippingFee,
      totalAmount: updatedOrderResult.totalAmount,
      paymentMethod: (updatedOrderResult.paymentMethod as PaymentMethod) || "COD",
      paymentStatus: (updatedOrderResult.paymentStatus as PaymentStatus) || "Unpaid",
      shippingStatus: (updatedOrderResult.shippingStatus as ShippingStatus) || "Pending",
      batchId: updatedOrderResult.batchId,
      createdAt: updatedOrderResult.createdAt,
      createdBy: (updatedOrderResult.createdBy as any) || { uid: "system", name: "System" },
      customerId: updatedOrderResult.customerId,
      customerEmail: updatedOrderResult.customerEmail || "",
      courierName: updatedOrderResult.courierName || "",
      trackingNumber: updatedOrderResult.trackingNumber || "",
      remarks: (updatedOrderResult.remarks as OrderRemark) || "",
      rushShip: updatedOrderResult.rushShip,
    };
  } catch (error: any) {
    console.error("Error in updateOrder:", error);
    throw new Error(error.message || "Failed to update order.");
  }
}

export async function cancelOrder(orderId: string): Promise<void> {
  console.log(`Starting cancellation for order: ${orderId}`);
  try {
    const user = await getCurrentUser();
    await prisma.$transaction(async (tx) => {
      // 1. Get the order with items
      const order = await tx.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        console.error(`Order ${orderId} not found`);
        throw new Error("Order not found");
      }

      if (order.shippingStatus === "Cancelled") {
        console.log(`Order ${orderId} is already cancelled`);
        return;
      }

      // 2. Parse items
      // 2. Parse items
      const rawItems = (order as any).items;
      let items: any[] = [];
      try {
        items = rawItems ? (typeof rawItems === 'string' ? JSON.parse(rawItems) : rawItems) : [];
      } catch (parseError) {
        console.error(`Error parsing items for order ${orderId}:`, parseError);
      }

      console.log(`Order ${orderId} has ${items.length} items to restock`);

      if (!Array.isArray(items) || items.length === 0) {
        console.warn(`No items found for order ${orderId} in structured 'items' field. Using fallback or logging warning.`);
      }

      // 3. Restock inventory
      for (const item of items) {
        const productId = item.product?.id || item.productId;
        // Robustly parse quantity, handling strings like "2", "2.0", etc.
        const rawQuantity = item.quantity;
        const quantityToIncrement = typeof rawQuantity === 'number' ? rawQuantity : parseInt(String(rawQuantity), 10);

        console.log(`Processing restock Item - ProductID: ${productId}, Quantity: ${quantityToIncrement} (Raw: ${rawQuantity})`);

        if (!productId) {
          console.error("Missing product ID in item:", JSON.stringify(item));
          continue;
        }

        if (isNaN(quantityToIncrement) || quantityToIncrement <= 0) {
          console.warn(`Skipping item with zero, invalid or missing quantity for product ${productId}. Parsed qty: ${quantityToIncrement}`);
          continue;
        }

        // Default to restocking quantity
        const updateData: any = { quantity: { increment: quantityToIncrement } };
        const location = "Main Inventory";

        console.log(`Restocking ${quantityToIncrement} of product ${productId} to ${location}`);

        try {
          const updatedProd = await tx.product.update({
            where: { id: productId },
            data: updateData,
            select: { id: true, quantity: true, name: true }
          });
          console.log(`Stock updated for ${updatedProd.name} (${productId}). New level: ${updatedProd.quantity}`);

          // Log inventory change
          const previousStock = updatedProd.quantity - quantityToIncrement;
          await createInventoryLog({
            action: "RETURNED",
            productId: productId,
            quantityChange: quantityToIncrement,
            previousStock: previousStock,
            newStock: updatedProd.quantity,
            reason: `Order #${orderId.substring(0, 8)} cancelled`,
            referenceId: orderId,
            orderId: orderId,
            branchId: null, // No specific branch for cancellations
          }, tx, user);
        } catch (updateError: any) {
          console.error(`Failed to restock product ${productId}:`, updateError.message);
          throw new Error(`Failed to restock product ${productId}: ${updateError.message}`);
        }
      }

      // Update Batch Totals (Decrement) if it was countable (Delivered)
      const isValidBatchId = (bid: string | null | undefined) => bid && bid !== 'none' && bid !== 'hold';
      if (order.shippingStatus === 'Delivered' && isValidBatchId(order.batchId)) {
        const targetBatchId = order.batchId!;
        const batch = await tx.batch.findUnique({ where: { id: targetBatchId } });
        if (batch) {
          await tx.batch.update({
            where: { id: targetBatchId },
            data: {
              totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
              totalSales: Math.max(0, (batch.totalSales || 0) - order.totalAmount)
            }
          });
        }
      }

      // 4. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          shippingStatus: "Cancelled"
        }
      });
      console.log(`Order ${orderId} marked as Cancelled`);

      // 5. Create Sales Log for Cancellation
      const now = new Date();
      const logId = `sl${Math.random().toString(36).substring(2, 15)}`;

      const ordersJson = JSON.stringify({
        id: orderId,
        orderDate: order.orderDate,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        shippingStatus: "Cancelled",
        createdBy: (order as any).createdBy
      });
      const shipmentsJson = JSON.stringify({
        address: order.address,
        courier: order.courierName,
        tracking: order.trackingNumber,
        shippingFee: order.shippingFee
      });
      const orderItemsJson = JSON.stringify(items);

      await tx.$executeRawUnsafe(
        `INSERT INTO sales_logs (id, orderId, description, products, orders, customerName, totalAmount, shipments, order_items, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        logId,
        orderId,
        "Order Cancelled",
        order.itemName,
        ordersJson,
        order.customerName,
        order.totalAmount,
        shipmentsJson,
        orderItemsJson,
        now
      );
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/customers");
    revalidatePath("/batches");
    revalidatePath("/dashboard");
  } catch (error: any) {
    console.error("Error in cancelOrder:", error);
    throw new Error(error.message || "Failed to cancel order.");
  }
}

export async function getSmartSuggestions(order: Order) {
  // Mock AI suggestions
  const statusOptions = ['Pending', 'Ready', 'Shipped', 'Delivered', 'Claimed'];
  const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

  const mockSuggestions = {
    suggestedStatus: randomStatus,
    reasoning: `Mock suggestion: Based on the order data, the status could be updated to ${randomStatus}.`,
  };

  return { success: true, data: mockSuggestions };
}
