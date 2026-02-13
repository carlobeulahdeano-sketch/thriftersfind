import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders/[id] - Get a specific order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        batch: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform the order data to match the expected format
    const transformedOrder = {
      id: order.id,
      customerName: order.customerName,
      contactNumber: order.contactNumber || "",
      address: order.address || "",
      orderDate: order.orderDate ? order.orderDate.toISOString().split('T')[0] : "",
      itemName: order.itemName,
      quantity: order.quantity,
      price: order.price,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      paymentMethod: (order.paymentMethod as any) || "COD",
      paymentStatus: (order.paymentStatus as any) || "Unpaid",
      shippingStatus: (order.shippingStatus as any) || "Pending",
      batchId: order.batchId,
      createdAt: order.createdAt,
      createdBy: (order.createdBy as any) || { uid: "system", name: "System" },
      customerId: order.customerId,
      customerEmail: order.customerEmail || "",
      courierName: order.courierName || "",
      trackingNumber: order.trackingNumber || "",
      remarks: (order.remarks as any) || "",
      rushShip: order.rushShip,
    };

    return NextResponse.json({ success: true, data: transformedOrder });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update a specific order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Update fields if provided
    if (body.customerName !== undefined) updateData.customerName = body.customerName;
    if (body.contactNumber !== undefined) updateData.contactNumber = body.contactNumber;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.orderDate !== undefined) updateData.orderDate = body.orderDate ? new Date(body.orderDate) : null;
    if (body.itemName !== undefined) updateData.itemName = body.itemName;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.shippingFee !== undefined) updateData.shippingFee = body.shippingFee;
    if (body.totalAmount !== undefined) updateData.totalAmount = body.totalAmount;
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.paymentStatus !== undefined) updateData.paymentStatus = body.paymentStatus;
    if (body.shippingStatus !== undefined) updateData.shippingStatus = body.shippingStatus;
    if (body.batchId !== undefined) updateData.batchId = body.batchId;
    if (body.customerId !== undefined) updateData.customerId = body.customerId;
    if (body.customerEmail !== undefined) updateData.customerEmail = body.customerEmail;
    if (body.courierName !== undefined) updateData.courierName = body.courierName;
    if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.rushShip !== undefined) updateData.rushShip = body.rushShip;
    if (body.createdBy !== undefined) updateData.createdBy = body.createdBy;

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        customer: true,
        batch: true,
      },
    });

    // Transform the order data
    const transformedOrder = {
      id: updatedOrder.id,
      customerName: updatedOrder.customerName,
      contactNumber: updatedOrder.contactNumber || "",
      address: updatedOrder.address || "",
      orderDate: updatedOrder.orderDate ? updatedOrder.orderDate.toISOString().split('T')[0] : "",
      itemName: updatedOrder.itemName,
      quantity: updatedOrder.quantity,
      price: updatedOrder.price,
      shippingFee: updatedOrder.shippingFee,
      totalAmount: updatedOrder.totalAmount,
      paymentMethod: (updatedOrder.paymentMethod as any) || "COD",
      paymentStatus: (updatedOrder.paymentStatus as any) || "Unpaid",
      shippingStatus: (updatedOrder.shippingStatus as any) || "Pending",
      batchId: updatedOrder.batchId,
      createdAt: updatedOrder.createdAt,
      createdBy: (updatedOrder.createdBy as any) || { uid: "system", name: "System" },
      customerId: updatedOrder.customerId,
      customerEmail: updatedOrder.customerEmail || "",
      courierName: updatedOrder.courierName || "",
      trackingNumber: updatedOrder.trackingNumber || "",
      remarks: (updatedOrder.remarks as any) || "",
      rushShip: updatedOrder.rushShip,
    };

    return NextResponse.json({ success: true, data: transformedOrder });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete a specific order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Delete the order
    await prisma.order.delete({
      where: { id: orderId }
    });

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
