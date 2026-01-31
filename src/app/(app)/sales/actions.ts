"use server";

import { prisma } from "@/lib/prisma";
import { Order } from "@/lib/types";
import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";
import { getCurrentUser } from "@/lib/auth-server";

export async function getSalesData(timeframe: "week" | "month" | "year"): Promise<Order[]> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return [];
        }

        const now = new Date();
        let startDate: Date;

        if (timeframe === 'week') {
            startDate = startOfWeek(now);
        } else if (timeframe === 'month') {
            startDate = startOfMonth(now);
        } else { // year
            startDate = startOfYear(now);
        }

        const endDate = endOfDay(now);

        const isSuperAdmin = user.role?.name === 'Super Admin';

        const orders = await prisma.order.findMany({
            where: {
                orderDate: {
                    gte: startDate,
                    lte: endDate,
                },
                paymentStatus: 'Paid',
            },
            orderBy: {
                orderDate: 'desc',
            },
        });

        // Filter orders based on user role
        const filteredOrders = isSuperAdmin
            ? orders
            : orders.filter(order => {
                if (!(order as any).createdBy) return false;
                const createdByData = (order as any).createdBy as any;
                return createdByData?.uid === user.id;
            });

        return filteredOrders.map((order: any) => ({
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
        }));
    } catch (error) {
        console.error("Error fetching sales data:", error);
        return [];
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

export async function getBatchAnalytics(startDate?: Date, endDate?: Date): Promise<BatchAnalytics[]> {
    try {
        const user = await getCurrentUser();
        if (!user) return [];

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
                        paymentStatus: 'Paid'
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

            // Convert map to array and sort
            const allProducts = Array.from(productSalesMap.values());
            allProducts.sort((a, b) => b.quantity - a.quantity);

            const bestSellingProduct = allProducts.length > 0 ? {
                name: allProducts[0].name,
                quantitySold: allProducts[0].quantity
            } : null;

            return {
                id: batch.id,
                batchName: batch.batchName,
                status: batch.status,
                manufactureDate: batch.manufactureDate,
                totalOrders: batch.orders.length,
                totalSales: batchTotalSales,
                totalCapital: batchTotalCapital,
                netProfit: batchTotalSales - batchTotalCapital,
                bestSellingProduct,
                topProducts: allProducts.slice(0, 10)
            };
        });

        return analytics;

    } catch (error) {
        console.error("Error fetching batch analytics:", error);
        return [];
    }
}
