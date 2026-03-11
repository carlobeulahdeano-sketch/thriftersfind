"use server";

import { prisma } from "@/lib/prisma";
import { Order, PreOrder } from "@/lib/types";
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";
import { getCurrentUser } from "@/lib/auth-server";

export async function getSalesData(timeframe: "week" | "month" | "year" | "all"): Promise<{ orders: Order[], isAuthorized: boolean }> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { orders: [], isAuthorized: false };
        }

        const isAuthorized = !!user.permissions?.sales;
        if (!isAuthorized) {
            return { orders: [], isAuthorized: false };
        }

        const now = new Date();
        let startDate: Date;

        if (timeframe === 'week') {
            startDate = startOfWeek(now);
        } else if (timeframe === 'month') {
            startDate = startOfMonth(now);
        } else if (timeframe === 'year') {
            startDate = startOfYear(now);
        } else { // all
            startDate = new Date(0);
        }

        const endDate = endOfDay(now);

        const orders = await prisma.order.findMany({
            where: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                // Removed strict paymentStatus filter to match dashboard aggregation
            },
        });

        // Sort orders by orderDate descending in JS to prevent MySQL out of sort memory error
        orders.sort((a, b) => {
            const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
            const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
            return dateB - dateA;
        });

        const mappedOrders = orders.map((order: any) => ({
            id: order.id,
            customerName: order.customerName,
            contactNumber: order.contactNumber || "",
            address: order.address || "",
            orderDate: order.orderDate.toISOString(),
            itemName: order.itemName,
            quantity: order.quantity,
            price: order.price,
            shippingFee: order.shippingFee,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod as any,
            paymentStatus: order.paymentStatus as any,
            shippingStatus: order.shippingStatus as any,
            batchId: order.batchId,
            customerId: order.customerId,
            rushShip: order.rushShip,
            customerEmail: order.customerEmail || "",
            courierName: order.courierName || "",
            trackingNumber: order.trackingNumber || "",
            remarks: order.remarks as any,
            items: order.items as any,
        }));

        return { orders: mappedOrders, isAuthorized: true };

    } catch (error) {
        console.error("Error fetching sales data:", error);
        return { orders: [], isAuthorized: false };
    }
}

export type BatchAnalytics = {
    id: string;
    batchName: string;
    status: string;
    manufactureDate: Date;
    totalOrders: number;
    totalSales: number;
    totalCapital: number;
    netProfit: number;
    totalPreOrders: number;
    preOrderSales: number;
    preOrderCapital: number;
    preOrderProfit: number;
    bestSellingProduct: {
        name: string;
        quantitySold: number;
    } | null;
    topProducts?: {
        name: string;
        quantity: number;
        sales: number;
    }[];
};

export async function getBatchAnalytics(startDate?: Date, endDate?: Date): Promise<{ batchAnalytics: BatchAnalytics[], isAuthorized: boolean }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { batchAnalytics: [], isAuthorized: false };

        const isAuthorized = !!user.permissions?.sales;
        if (!isAuthorized) {
            return { batchAnalytics: [], isAuthorized: false };
        }

        const dateFilter: any = {};
        if (startDate && endDate) {
            dateFilter.manufactureDate = {
                gte: startDate,
                lte: endDate,
            };
        }

        const batches = await prisma.batch.findMany({
            where: dateFilter,
            include: {
                orders: {
                    where: {
                        shippingStatus: 'Delivered'
                    }
                },
                preOrders: {
                    where: {
                        paymentStatus: 'Paid'
                    },
                    include: {
                        items: true,
                        product: true
                    }
                }
            },
            orderBy: {
                manufactureDate: 'desc'
            }
        });

        const analytics = batches.map(batch => {
            let batchTotalSales = 0;
            let batchTotalCapital = 0;
            let batchPreOrderSales = 0;
            let batchPreOrderCapital = 0;
            const productSalesMap = new Map<string, { name: string; quantity: number; sales: number }>();

            batch.orders.forEach((order: any) => {
                batchTotalSales += order.totalAmount;

                if (order.items) {
                    const items = Array.isArray(order.items) ? order.items : (order.items as any).items || [];

                    (items as any[]).forEach((item: any) => {
                        const qty = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0);
                        const cost = item.product?.cost || 0;
                        const productName = item.product?.name || "Unknown Product";

                        batchTotalCapital += qty * cost;

                        const current = productSalesMap.get(productName) || { name: productName, quantity: 0, sales: 0 };
                        current.quantity += qty;
                        productSalesMap.set(productName, current);
                    });
                }
            });

            if (batch.preOrders) {
                batch.preOrders.forEach((preOrder: any) => {
                    batchPreOrderSales += preOrder.totalAmount;

                    if (preOrder.items && Array.isArray(preOrder.items)) {
                        preOrder.items.forEach((item: any) => {
                            const qty = typeof item.quantity === 'string' ? parseInt(item.quantity) : (item.quantity || 0);
                            const cost = preOrder.product?.cost || 0;
                            batchPreOrderCapital += qty * cost;

                            const productName = item.productName || preOrder.product?.name || "Unknown Product";
                            const current = productSalesMap.get(productName) || { name: productName, quantity: 0, sales: 0 };
                            current.quantity += qty;
                            productSalesMap.set(productName, current);
                        });
                    }
                });
            }

            // Convert map to array and sort
            const allProducts = Array.from(productSalesMap.values());
            allProducts.sort((a, b) => b.quantity - a.quantity);

            const bestSellingProduct = allProducts.length > 0 ? {
                name: allProducts[0].name,
                quantitySold: allProducts[0].quantity
            } : null;

            return {
                id: String(batch.id),
                batchName: batch.batchName,
                status: batch.status,
                manufactureDate: batch.manufactureDate,
                totalOrders: batch.orders.length,
                totalSales: batchTotalSales,
                totalCapital: batchTotalCapital,
                netProfit: batchTotalSales - batchTotalCapital,
                totalPreOrders: batch.preOrders?.length || 0,
                preOrderSales: batchPreOrderSales,
                preOrderCapital: batchPreOrderCapital,
                preOrderProfit: batchPreOrderSales - batchPreOrderCapital,
                bestSellingProduct,
                topProducts: allProducts.slice(0, 10)
            };
        });

        return { batchAnalytics: analytics, isAuthorized: true };

    } catch (error) {
        console.error("Error fetching batch analytics:", error);
        return { batchAnalytics: [], isAuthorized: false };
    }
}

export async function getPreOrderSalesData(timeframe: "week" | "month" | "year" | "all"): Promise<{ preOrders: PreOrder[], isAuthorized: boolean }> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { preOrders: [], isAuthorized: false };
        }

        const isAuthorized = !!user.permissions?.sales;
        if (!isAuthorized) {
            return { preOrders: [], isAuthorized: false };
        }

        const now = new Date();
        let startDate: Date;

        if (timeframe === 'week') {
            startDate = startOfWeek(now);
        } else if (timeframe === 'month') {
            startDate = startOfMonth(now);
        } else if (timeframe === 'year') {
            startDate = startOfYear(now);
        } else { // all
            startDate = new Date(0);
        }

        const endDate = endOfDay(now);

        const preOrders = await prisma.preOrder.findMany({
            where: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                paymentStatus: 'Paid', // Only include paid pre-orders
            },
            include: {
                customer: true,
                items: true,
                batch: true,
            },
        });

        // Sort preOrders by orderDate descending in JS to prevent MySQL out of sort memory error
        preOrders.sort((a, b) => {
            const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
            const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
            return dateB - dateA;
        });

        const mappedPreOrders = preOrders.map((preOrder: any) => ({
            id: preOrder.id,
            customerName: preOrder.customerName,
            contactNumber: preOrder.contactNumber || "",
            address: preOrder.address || "",
            orderDate: preOrder.orderDate ? preOrder.orderDate.toISOString() : new Date().toISOString(),
            totalAmount: preOrder.totalAmount,
            paymentMethod: preOrder.paymentMethod || "",
            paymentStatus: preOrder.paymentStatus || "",
            depositAmount: preOrder.depositAmount || 0,
            customerId: preOrder.customerId,
            customerEmail: preOrder.customerEmail || "",
            remarks: preOrder.remarks || "",
            createdAt: preOrder.createdAt.toISOString(),
            updatedAt: preOrder.updatedAt.toISOString(),
            items: preOrder.items,
            batchId: preOrder.batchId,
            batch: preOrder.batch,
            customer: preOrder.customer ? {
                id: preOrder.customer.id,
                name: preOrder.customer.name,
                email: preOrder.customer.email,
                phone: preOrder.customer.phone || "",
                avatar: preOrder.customer.avatar || "",
                address: preOrder.customer.street ? {
                    street: preOrder.customer.street,
                    city: preOrder.customer.city || "",
                    state: preOrder.customer.state || "",
                    zip: preOrder.customer.zip || "",
                } : {
                    street: "",
                    city: "",
                    state: "",
                    zip: "",
                },
                orderHistory: [],
                totalSpent: 0,
            } : undefined,
        }));

        return { preOrders: mappedPreOrders, isAuthorized: true };

    } catch (error) {
        console.error("Error fetching pre-order sales data:", error);
        return { preOrders: [], isAuthorized: false };
    }
}
