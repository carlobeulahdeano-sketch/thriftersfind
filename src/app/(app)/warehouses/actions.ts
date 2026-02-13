"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { WarehouseProduct } from "@/lib/types";
import { createNotification, checkAndNotifyStock } from "@/app/(app)/inventory/notifications-actions";

export async function getWarehouse(id: string) {
    // Dummy implementation to satisfy build
    return { name: "Unknown Warehouse", location: "Unknown Location" };
}

export async function getWarehouseProducts(id?: string): Promise<WarehouseProduct[]> {
    try {
        const products = await prisma.warehouseProduct.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return products.map(product => ({
            id: product.id,
            productName: product.productName,
            sku: product.sku,
            quantity: product.quantity,
            manufacture_date: product.manufacture_date,
            image: product.image,
            location: product.location,
            cost: product.cost,
            retailPrice: product.retailPrice,
            images: product.images,
            createdBy: product.createdBy,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            alertStock: product.alertStock,
        }));
    } catch (error) {
        console.error("Error fetching warehouse products:", error);
        return [];
    }
}

export async function getWarehouseProduct(id: string): Promise<WarehouseProduct | null> {
    try {
        const product = await prisma.warehouseProduct.findUnique({
            where: { id }
        });

        if (!product) return null;

        return {
            id: product.id,
            productName: product.productName,
            sku: product.sku,
            quantity: product.quantity,
            manufacture_date: product.manufacture_date,
            image: product.image,
            location: product.location,
            cost: product.cost,
            retailPrice: product.retailPrice,
            images: product.images,
            createdBy: product.createdBy,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
            alertStock: product.alertStock,
        };
    } catch (error) {
        console.error("Error fetching warehouse product:", error);
        return null;
    }
}

export async function createWarehouseProduct(data: {
    productName: string;
    sku: string;
    quantity: number;
    cost: number;
    manufacture_date?: Date | string | null;
    image?: string | null;
    location?: string | null;
    retailPrice?: number | null;
    batchId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
    try {
        // Validate required fields
        if (!data.productName) return { success: false, error: "Product name is required" };
        if (!data.sku) return { success: false, error: "SKU is required" };

        await prisma.warehouseProduct.create({
            data: {
                productName: data.productName,
                sku: data.sku,
                quantity: data.quantity || 0,
                cost: data.cost || 0,
                manufacture_date: data.manufacture_date ? new Date(data.manufacture_date) : null,
                image: data.image,
                location: data.location,
                retailPrice: data.retailPrice,
                batchId: data.batchId || null,
            },
        });

        revalidatePath("/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating warehouse product:", error);
        return { success: false, error: error.message || "Failed to create warehouse product" };
    }
}

export async function updateWarehouseProduct(
    id: string,
    data: {
        productName?: string;
        sku?: string;
        quantity?: number;
        cost?: number;
        manufacture_date?: Date | string | null;
        image?: string | null;
        location?: string | null;
        retailPrice?: number | null;
        batchId?: string | null;
        alertStock?: number;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.warehouseProduct.update({
            where: { id },
            data: {
                ...(data.productName !== undefined && { productName: data.productName }),
                ...(data.sku !== undefined && { sku: data.sku }),
                ...(data.quantity !== undefined && { quantity: data.quantity }),
                ...(data.cost !== undefined && { cost: data.cost }),
                ...(data.manufacture_date !== undefined && { manufacture_date: data.manufacture_date ? new Date(data.manufacture_date) : null }),
                ...(data.image !== undefined && { image: data.image }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.retailPrice !== undefined && { retailPrice: data.retailPrice }),
                ...(data.batchId !== undefined && { batchId: data.batchId }),
                ...(data.alertStock !== undefined && { alertStock: data.alertStock }),
            },
        });

        // Check for low stock notification
        if ((data.quantity !== undefined || data.alertStock !== undefined)) {
            const updatedProduct = await prisma.warehouseProduct.findUnique({
                where: { id },
                select: { productName: true, sku: true, quantity: true, alertStock: true }
            });

            if (updatedProduct) {
                await checkAndNotifyStock({
                    productName: updatedProduct.productName,
                    sku: updatedProduct.sku,
                    quantity: updatedProduct.quantity,
                    alertStock: updatedProduct.alertStock,
                });
            }
        }

        revalidatePath("/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating warehouse product:", error);
        return { success: false, error: error.message || "Failed to update warehouse product" };
    }
}

export async function deleteWarehouseProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.warehouseProduct.delete({
            where: { id },
        });

        revalidatePath("/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting warehouse product:", error);
        return { success: false, error: error.message || "Failed to delete warehouse product" };
    }
}

export async function adjustWarehouseStock(
    id: string,
    adjustment: number
): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.warehouseProduct.update({
            where: { id },
            data: {
                quantity: {
                    increment: adjustment,
                },
            },
        });

        // Check for low stock notification
        const updatedProduct = await prisma.warehouseProduct.findUnique({
            where: { id },
            select: { productName: true, sku: true, quantity: true, alertStock: true }
        });

        if (updatedProduct) {
            await checkAndNotifyStock({
                productName: updatedProduct.productName,
                sku: updatedProduct.sku,
                quantity: updatedProduct.quantity,
                alertStock: updatedProduct.alertStock,
            });
        }

        revalidatePath("/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error adjusting warehouse stock:", error);
        return { success: false, error: error.message || "Failed to adjust stock" };
    }
}
