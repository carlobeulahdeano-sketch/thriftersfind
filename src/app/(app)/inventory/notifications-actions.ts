"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/auth-server";
import { unstable_noStore as noStore } from "next/cache";

export async function getNotifications() {
    noStore();
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { userId: Number(user.id) },
                    { userId: null }
                ],
                read: false
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });
        return notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Not authenticated" };

        await prisma.notification.updateMany({
            where: {
                OR: [
                    { userId: Number(user.id) },
                    { userId: null }
                ],
                read: false
            },
            data: {
                read: true
            }
        });
        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false, error: "Failed to mark notifications as read" };
    }
}

export async function createNotification(data: { title: string; message: string; type: string; userId?: string | null }) {
    try {
        const notification = await prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type,
                userId: data.userId ? Number(data.userId) : null,
                read: false,
            }
        });
        revalidatePath("/");
        return notification;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw new Error("Failed to create notification");
    }
}

export async function checkAndNotifyStock(data: { productName: string; sku: string; quantity: number; alertStock: number; userId?: string | null }) {
    try {
        // Automatically resolve (mark as read) notifications when stock levels improve
        if (data.quantity > data.alertStock) {
            // Stock is fully replenished, resolve both 'low_stock' and 'out_of_stock' alerts
            await prisma.notification.updateMany({
                where: {
                    type: { in: ["low_stock", "out_of_stock"] },
                    message: { contains: `(SKU: ${data.sku})` },
                    read: false,
                },
                data: { read: true },
            });
        } else if (data.quantity > 0) {
            // Stock is no longer completely out, resolve 'out_of_stock' alerts
            await prisma.notification.updateMany({
                where: {
                    type: "out_of_stock",
                    message: { contains: `(SKU: ${data.sku})` },
                    read: false,
                },
                data: { read: true },
            });
        }

        if (data.alertStock > 0 && data.quantity <= data.alertStock) {
            const isOutOfStock = data.quantity <= 0;
            const alertType = isOutOfStock ? "out_of_stock" : "low_stock";

            // Check if there's already an unread notification for this state to prevent spam
            const existingAlert = await prisma.notification.findFirst({
                where: {
                    type: alertType,
                    message: { contains: `(SKU: ${data.sku})` },
                    read: false
                }
            });

            if (!existingAlert) {
                await createNotification({
                    title: isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert",
                    message: `Product ${data.productName} (SKU: ${data.sku}) is ${isOutOfStock ? "out of stock" : "running low"}. Current stock: ${data.quantity}.`,
                    type: alertType,
                    userId: data.userId
                });
            }
        }
    } catch (error) {
        console.error("Error checking and notifying stock:", error);
    }
}

