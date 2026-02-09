"use server";

import { Customer, UserRole, OrderHistoryItem, YearlyOrderSummary } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function getCustomers(): Promise<Customer[]> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  // Filter: Show all customers EXCEPT "Walk In Customer" from other users
  const filteredCustomers = customers.filter(customer => {
    // Check if customer is "Walk In Customer" (case-insensitive)
    const isWalkIn = customer.name.trim().toLowerCase() === "walk in customer";

    // If not "Walk In Customer", show it (global visibility)
    if (!isWalkIn) return true;

    // If it IS "Walk In Customer", only show if created by current user
    const createdBy = (customer as any).createdBy as { uid: string } | null;
    return createdBy?.uid === user.id;
  });

  return filteredCustomers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
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
      .map(order => ({
        orderId: order.id,
        date: order.createdAt.toISOString(),
        amount: order.totalAmount,
        items: order.itemName,
        year: order.createdAt.getFullYear(),
        paymentMethod: order.paymentMethod || 'N/A',
        shippingStatus: order.shippingStatus || 'N/A'
      })),
    totalSpent: customer.orders
      .filter(order => order.shippingStatus === 'Delivered')
      .reduce((sum, order) => sum + order.totalAmount, 0),
    role: customer.role as UserRole | undefined,
  }));
}

export async function createCustomer(customerData: Omit<Customer, 'id'>): Promise<Customer> {
  const user = await getCurrentUser();
  const createdBy = user ? {
    uid: user.id,
    name: user.name,
    email: user.email
  } : { uid: "system", name: "System" };

  // Check if customer with same email already exists
  const existingByEmail = await prisma.customer.findUnique({
    where: { email: customerData.email },
    include: { orders: true }
  });

  if (existingByEmail) {
    return {
      id: existingByEmail.id,
      name: existingByEmail.name,
      email: existingByEmail.email,
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
    };
  }

  const newCustomer = await prisma.customer.create({
    data: {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      avatar: customerData.avatar,
      street: customerData.address.street,
      city: customerData.address.city,
      state: customerData.address.state,
      zip: customerData.address.zip,
      role: customerData.role,
      createdBy: createdBy as any,
    },
  });

  return {
    id: newCustomer.id,
    name: newCustomer.name,
    email: newCustomer.email,
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
  };
}

export async function getCustomerOrdersByYear(
  customerId: string,
  year?: number
): Promise<YearlyOrderSummary[]> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' }
      }
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

