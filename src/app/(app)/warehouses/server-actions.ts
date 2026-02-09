"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createWarehouseProduct(data: {
    productName: string;
    sku: string;
    quantity: number;
    alertStock?: number;
    cost: number;
    manufacture_date?: Date | string | null;
    image?: string | null;
    location?: string | null;
    retailPrice?: number | null;
    batchId?: string | null;
    productId?: string | null;
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
                alertStock: data.alertStock || 0,
                cost: data.cost || 0,
                manufacture_date: data.manufacture_date ? new Date(data.manufacture_date) : null,
                image: data.image,
                location: data.location,
                retailPrice: data.retailPrice,
                batchId: data.batchId || null,
                productId: data.productId || null,
            },
        });

        revalidatePath("/warehouses");
        return { success: true };
    } catch (error: any) {
        console.error("Error creating warehouse product:", error);
        return { success: false, error: error.message || "Failed to create warehouse product" };
    }
}
