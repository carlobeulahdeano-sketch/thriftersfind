"use server";

import { prisma } from "@/lib/prisma";
import { Batch } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";

export async function getBatches(): Promise<{ batches: Batch[], isAuthorized: boolean }> {
    try {
        const user = await getCurrentUser();

        if (!user || (!user.permissions?.batches && !user.permissions?.dashboard)) {
            return { batches: [], isAuthorized: false };
        }

        const batches = await prisma.batch.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                orders: {
                    select: {
                        totalAmount: true,
                        shippingStatus: true
                    }
                }
            }
        });

        const mappedBatches = batches.map((batch: any) => {
            const deliveredOrders = batch.orders?.filter((order: any) => order.shippingStatus === 'Delivered') || [];
            const calculatedTotalOrders = deliveredOrders.length;
            const calculatedTotalSales = deliveredOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);

            return {
                id: batch.id,
                batchName: batch.batchName,
                manufactureDate: batch.manufactureDate.toISOString(),
                status: batch.status as any,
                totalOrders: calculatedTotalOrders,
                totalSales: calculatedTotalSales,
            };
        });

        return { batches: mappedBatches, isAuthorized: true };

    } catch (error) {
        console.error("Error fetching batches:", error);
        return { batches: [], isAuthorized: false };
    }
}

export async function createBatch(data: {
    batchName: string;
    manufactureDate: string;
    status: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.batches) {
            return { success: false, error: "Permission denied" };
        }
        const createdBy = {
            uid: user.id,
            name: user.name,
            email: user.email
        };

        const newBatch = await prisma.batch.create({
            data: {
                batchName: data.batchName,
                // @ts-ignore - Prisma client needs regeneration
                manufactureDate: new Date(data.manufactureDate),
                status: data.status,
                createdBy: createdBy as any,
                totalOrders: 0,
                totalSales: 0,
            },
        });

        revalidatePath("/batches");
        return {
            success: true,
            data: {
                id: newBatch.id,
                batchName: newBatch.batchName,
                manufactureDate: newBatch.manufactureDate.toISOString(),
                status: newBatch.status,
                totalOrders: 0,
                totalSales: 0
            }
        };
    } catch (error: any) {
        console.error("Error creating batch:", error);
        return { success: false, error: error.message || "Failed to create batch" };
    }
}

export async function updateBatch(id: string, data: {
    batchName?: string;
    manufactureDate?: string;
    status?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.batches) {
            return { success: false, error: "Permission denied" };
        }
        await prisma.batch.update({
            where: { id },
            data: {
                batchName: data.batchName,
                // @ts-ignore - Prisma client needs regeneration
                manufactureDate: data.manufactureDate ? new Date(data.manufactureDate) : undefined,
                status: data.status,
            },
        });

        revalidatePath("/batches");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating batch:", error);
        return { success: false, error: error.message || "Failed to update batch" };
    }
}

export async function deleteBatch(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.batches) {
            return { success: false, error: "Permission denied" };
        }
        await prisma.batch.delete({
            where: { id },
        });

        revalidatePath("/batches");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting batch:", error);
        return { success: false, error: error.message || "Failed to delete batch" };
    }
}
