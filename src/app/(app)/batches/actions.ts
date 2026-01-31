"use server";

import { prisma } from "@/lib/prisma";
import { Batch } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";

export async function getBatches(): Promise<Batch[]> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return [];
        }

        const isSuperAdmin = user.role?.name === 'Super Admin';

        const batches = await prisma.batch.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                _count: {
                    select: { orders: true }
                },
                orders: {
                    select: { totalAmount: true }
                }
            }
        });

        // Filter batches based on user role
        const filteredBatches = isSuperAdmin
            ? batches
            : batches.filter(batch => {
                if (!(batch as any).createdBy) return false;
                const createdByData = (batch as any).createdBy as any;
                return createdByData?.uid === user.id;
            });

        return filteredBatches.map((batch: any) => ({
            id: batch.id,
            batchName: batch.batchName,
            manufactureDate: batch.manufactureDate.toISOString(),
            status: batch.status as any,
            totalOrders: batch.totalOrders || 0,
            totalSales: batch.totalSales || 0,
        }));
    } catch (error) {
        console.error("Error fetching batches:", error);
        return [];
    }
}

export async function createBatch(data: {
    batchName: string;
    manufactureDate: string;
    status: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        const createdBy = user ? {
            uid: user.id,
            name: user.name,
            email: user.email
        } : { uid: "system", name: "System" };

        await prisma.batch.create({
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
        return { success: true };
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
