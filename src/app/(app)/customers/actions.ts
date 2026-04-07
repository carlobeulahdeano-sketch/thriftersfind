"use server";

import { Customer, UserRole, OrderHistoryItem, YearlyOrderSummary } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function getCustomers(): Promise<Customer[]> {
  const user = await getCurrentUser();

  if (!user || (!user.permissions?.customers && !user.permissions?.dashboard)) {
    return [];
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: true
    }
  });

  // RAW SQL FALLBACK: Since Prisma Client might be stale and not fetching the isActive column,
  // we fetch it manually using a raw query.
  const statuses = await prisma.$queryRaw<any[]>`SELECT id, isActive FROM customers`;
  const statusMap = statuses.reduce((acc, curr) => {
    // MySQL TINYINT(1) can come as number 0/1 or boolean true/false depending on driver
    acc[curr.id] = curr.isActive;
    return acc;
  }, {} as Record<string, any>);

  // Filter: Show all customers EXCEPT "Walk In Customer" from other users
  const filteredCustomers = customers.filter(customer => {
    // Check if customer is "Walk In Customer" (case-insensitive)
    const isWalkIn = customer.name.trim().toLowerCase() === "walk in customer";

    // If not "Walk In Customer", show it (global visibility)
    if (!isWalkIn) return true;

    // If it IS "Walk In Customer", only show if created by current user
    const createdBy = (customer as any).createdBy as { uid: string } | null;
    return String(createdBy?.uid) === String(user.id);
  });

  return filteredCustomers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email || undefined,
    phone: customer.phone || "",
    avatar: customer.avatar || "",
    address: customer.street ? {
      street: customer.street,
      city: customer.city || "",
      state: customer.state || "",
      zip: customer.zip || "",
    } : {
      street: "",
      city: "",
      state: "",
      zip: "",
    },
    orderHistory: customer.orders
      .filter(order => order.shippingStatus === 'Delivered')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(order => ({
        orderId: order.id,
        date: order.createdAt.toISOString(),
        amount: order.totalAmount,
        items: order.itemName,
        year: order.createdAt.getFullYear(),
        paymentMethod: order.paymentMethod || 'N/A',
        shippingStatus: order.shippingStatus || 'N/A'
      })),
    totalSpent: customer.totalSpent || 0,
    role: customer.role as UserRole | undefined,
    isActive: statusMap[customer.id] === undefined ? true : Number(statusMap[customer.id]) !== 0,
  }));
}

export async function createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.customers) {
      throw new Error("Permission denied");
    }
    const createdBy = {
      uid: user.id,
      name: user.name,
      email: user.email
    };

    // Check if customer with same email already exists (only if email is provided)
    if (customerData.email && customerData.email.trim() !== "") {
      const existingByEmail = await prisma.customer.findUnique({
        where: { email: customerData.email },
        include: { orders: true }
      });

      if (existingByEmail) {
        return {
          id: existingByEmail.id,
          name: existingByEmail.name,
          email: existingByEmail.email || "",
          phone: existingByEmail.phone || "",
          avatar: existingByEmail.avatar || "",
          address: {
            street: existingByEmail.street || "",
            city: existingByEmail.city || "",
            state: existingByEmail.state || "",
            zip: existingByEmail.zip || "",
          },
          orderHistory: existingByEmail.orders
            .filter(order => order.shippingStatus === 'Delivered')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map(order => ({
              orderId: order.id,
              date: order.createdAt.toISOString(),
              amount: order.totalAmount,
              items: order.itemName,
              year: order.createdAt.getFullYear(),
              paymentMethod: order.paymentMethod || 'N/A',
              shippingStatus: order.shippingStatus || 'N/A'
            })),
          totalSpent: existingByEmail.orders
            .filter(order => order.shippingStatus === 'Delivered')
            .reduce((sum, order) => sum + order.totalAmount, 0),
          role: existingByEmail.role as UserRole | undefined,
          isActive: (existingByEmail as any).isActive,
        };
      }
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: customerData.name,
        email: customerData.email || null,
        phone: customerData.phone || null,
        avatar: customerData.avatar || null,
        street: customerData.address.street || null,
        city: customerData.address.city || null,
        state: customerData.address.state || null,
        zip: customerData.address.zip || null,
        role: customerData.role,
        createdBy: createdBy as any,
        isActive: true,
      } as any,
    });

    return {
      id: newCustomer.id,
      name: newCustomer.name,
      email: newCustomer.email || "",
      phone: newCustomer.phone || "",
      avatar: newCustomer.avatar || "",
      address: {
        street: newCustomer.street || "",
        city: newCustomer.city || "",
        state: newCustomer.state || "",
        zip: newCustomer.zip || "",
      },
      orderHistory: [],
      totalSpent: 0,
      role: newCustomer.role as UserRole | undefined,
      isActive: true,
    };
  } catch (error: any) {
    console.error('Error in createCustomer:', error);

    // Re-throw with more context
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      throw new Error('Database connection lost. Please try again.');
    }

    throw error;
  }
}

export async function updateCustomer(
  customerId: string,
  customerData: Partial<Omit<Customer, 'id' | 'orderHistory' | 'totalSpent'>>
): Promise<Customer> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.customers) {
      throw new Error("Permission denied");
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: Number(customerId) },
      data: {
        name: customerData.name,
        email: customerData.email || (customerData.email === "" ? null : undefined),
        phone: customerData.phone || (customerData.phone === "" ? null : undefined),
        avatar: customerData.avatar,
        street: customerData.address?.street || (customerData.address?.street === "" ? null : undefined),
        city: customerData.address?.city || (customerData.address?.city === "" ? null : undefined),
        state: customerData.address?.state || (customerData.address?.state === "" ? null : undefined),
        zip: customerData.address?.zip || (customerData.address?.zip === "" ? null : undefined),
        role: customerData.role,
        isActive: customerData.isActive,
      } as any,
      include: {
        orders: true
      }
    });

    return {
      id: updatedCustomer.id,
      name: updatedCustomer.name,
      email: updatedCustomer.email || undefined,
      phone: updatedCustomer.phone || "",
      avatar: updatedCustomer.avatar || "",
      address: {
        street: updatedCustomer.street || "",
        city: updatedCustomer.city || "",
        state: updatedCustomer.state || "",
        zip: updatedCustomer.zip || "",
      },
      orderHistory: updatedCustomer.orders
        .filter(order => order.shippingStatus === 'Delivered')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(order => ({
          orderId: order.id,
          date: order.createdAt.toISOString(),
          amount: order.totalAmount,
          items: order.itemName,
          year: order.createdAt.getFullYear(),
          paymentMethod: order.paymentMethod || 'N/A',
          shippingStatus: order.shippingStatus || 'N/A'
        })),
      totalSpent: updatedCustomer.orders
        .filter(order => order.shippingStatus === 'Delivered')
        .reduce((sum, order) => sum + order.totalAmount, 0),
      role: updatedCustomer.role as UserRole | undefined,
      isActive: customerData.isActive !== undefined ? customerData.isActive : (updatedCustomer as any).isActive,
    };
  } catch (error: any) {
    console.error('Error in updateCustomer:', error);

    if (error.code === 'P2025') {
      throw new Error('Customer not found.');
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      throw new Error('Database connection lost. Please try again.');
    }

    throw error;
  }
}

export async function getCustomerOrdersByYear(
  customerId: string,
  year?: number
): Promise<YearlyOrderSummary[]> {
  const customer = await prisma.customer.findUnique({
    where: { id: Number(customerId) },
    include: {
      orders: true
    }
  });

  if (!customer) {
    return [];
  }

  // Filter by Delivered shipping status and year if provided
  const baseFilteredOrders = customer.orders.filter(order => order.shippingStatus === 'Delivered');
  const filteredOrders = year
    ? baseFilteredOrders.filter(order => order.createdAt.getFullYear() === year)
    : baseFilteredOrders;

  // Ensure orders are sorted by date descending, as we removed orderBy from DB query
  filteredOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Group orders by year
  const ordersByYear = filteredOrders.reduce((acc, order) => {
    const orderYear = order.createdAt.getFullYear();
    if (!acc[orderYear]) {
      acc[orderYear] = [];
    }
    acc[orderYear].push({
      orderId: order.id,
      date: order.createdAt.toISOString(),
      amount: order.totalAmount,
      items: order.itemName,
      year: orderYear,
      paymentMethod: order.paymentMethod || 'N/A',
      shippingStatus: order.shippingStatus || 'N/A'
    });
    return acc;
  }, {} as Record<number, OrderHistoryItem[]>);

  // Convert to YearlyOrderSummary array
  return Object.entries(ordersByYear)
    .map(([yearStr, orders]) => ({
      year: parseInt(yearStr),
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + order.amount, 0),
      orders: orders
    }))
    .sort((a, b) => b.year - a.year); // Sort by year descending
}

export async function toggleCustomerStatus(customerId: string | number, isActive: boolean): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user || (!user.permissions?.customers && !user.permissions?.dashboard)) {
      throw new Error("Permission denied");
    }

    console.log(`Toggling customer ${customerId} to ${isActive}`);

    // Use raw SQL with template literals ($executeRaw)
    await prisma.$executeRaw`UPDATE customers SET isActive = ${isActive ? 1 : 0} WHERE id = ${customerId}`;

    return true;
  } catch (error) {
    console.error('Error in toggleCustomerStatus:', error);
    return false;
  }
}

export async function deleteCustomer(customerId: string | number): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.customers) {
      throw new Error("Permission denied");
    }

    const id = Number(customerId);

    // Check for orders
    const orderCount = await prisma.order.count({
      where: { customerId: id }
    });

    if (orderCount > 0) {
      return { 
        success: false, 
        message: "Cannot delete customer with existing orders. Consider deactivating instead." 
      };
    }

    // Check for pre-orders
    const preOrderCount = await prisma.preOrder.count({
      where: { customerId: id }
    });

    if (preOrderCount > 0) {
      return { 
        success: false, 
        message: "Cannot delete customer with existing pre-orders. Consider deactivating instead." 
      };
    }

    await prisma.customer.delete({
      where: { id: id }
    });

    return { success: true, message: "Customer deleted successfully" };
  } catch (error: any) {
    console.error('Error in deleteCustomer:', error);
    return { 
      success: false, 
      message: error.message || "Failed to delete customer" 
    };
  }
}

