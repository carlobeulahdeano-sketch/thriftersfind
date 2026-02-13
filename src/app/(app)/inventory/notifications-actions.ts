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
                    { userId: user.id },
                    { userId: null }
                ]
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
                    { userId: user.id },
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
                userId: data.userId || null,
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
        if (data.alertStock > 0 && data.quantity <= data.alertStock) {
            const isOutOfStock = data.quantity <= 0;
            await createNotification({
                title: isOutOfStock ? "Out of Stock Alert" : "Low Stock Alert",
                message: `Product ${data.productName} (SKU: ${data.sku}) is ${isOutOfStock ? "out of stock" : "running low"}. Current stock: ${data.quantity}.`,
                type: isOutOfStock ? "out_of_stock" : "low_stock",
                userId: data.userId
            });
        }
    } catch (error) {
        console.error("Error checking and notifying stock:", error);
    }
}

