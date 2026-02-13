"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createInventoryLog } from "@/lib/inventory-log-helper";
import { WarehouseProduct } from "@/lib/types";

export async function getWarehouseProducts(warehouseId: string): Promise<WarehouseProduct[]> {
    try {
        const products = await prisma.warehouseProduct.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return products;
    } catch (error) {
        console.error("Error fetching warehouse products:", error);
        return [];
    }
}

export async function createWarehouseProduct(data: {
    warehouseId: string;
    productName: string;
    sku: string;
    quantity: number;
    manufacturer?: string | null;
    location?: string | null;
    cost: number;
    retailPrice?: number | null;
    images?: any;
    createdBy?: any;
    productId?: string | null;
}): Promise<{ success: boolean; error?: string }> {
    try {
        if (!data.productName || !data.sku || data.quantity === undefined || !data.cost) {
            return { success: false, error: "Product name, SKU, quantity, and cost are required" };
        }

        // Check if SKU already exists
        const existing = await prisma.warehouseProduct.findFirst({
            where: {
                sku: data.sku
            }
        });

        if (existing) {
            return { success: false, error: "A product with this SKU already exists in this warehouse" };
        }

        // Auto-link: If productId is missing, try to find product by SKU and link it
        let finalProductId = data.productId;
        if (!finalProductId && data.sku) {
            const linkedProduct = await prisma.product.findFirst({
                where: { sku: data.sku },
                select: { id: true }
            });
            if (linkedProduct) finalProductId = linkedProduct.id;
        }

        await prisma.warehouseProduct.create({
            data: {
                productName: data.productName,
                sku: data.sku,
                quantity: data.quantity,
                location: data.location,
                cost: data.cost,
                retailPrice: data.retailPrice,
                images: data.images,
                createdBy: data.createdBy,
                productId: finalProductId,
            },
        });

        revalidatePath(`/warehouses`);
        return { success: true };
    } catch (error: any) {
        console.error("Error creating warehouse product:", error);
        return { success: false, error: error.message || "Failed to create product" };
    }
}

export async function updateWarehouseProduct(
    id: string,
    data: {
        productName?: string;
        sku?: string;
        quantity?: number;
        manufacturer?: string | null;
        location?: string | null;
        cost?: number;
        retailPrice?: number | null;
        images?: any;
        productId?: string | null;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const product = await prisma.warehouseProduct.findUnique({ where: { id } });
        if (!product) {
            return { success: false, error: "Product not found" };
        }

        // If SKU is being updated, check for duplicates
        if (data.sku && data.sku !== product.sku) {
            const existing = await prisma.warehouseProduct.findFirst({
                where: {
                    sku: data.sku,
                    NOT: { id }
                }
            });

            if (existing) {
                return { success: false, error: "A product with this SKU already exists in this warehouse" };
            }
        }

        await prisma.warehouseProduct.update({
            where: { id },
            data: {
                ...(data.productName !== undefined && { productName: data.productName }),
                ...(data.sku !== undefined && { sku: data.sku }),
                ...(data.quantity !== undefined && { quantity: data.quantity }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.cost !== undefined && { cost: data.cost }),
                ...(data.retailPrice !== undefined && { retailPrice: data.retailPrice }),
                ...(data.images !== undefined && { images: data.images }),
                ...(data.productId !== undefined && { productId: data.productId }),
            },
        });

        revalidatePath(`/warehouses`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating warehouse product:", error);
        return { success: false, error: error.message || "Failed to update product" };
    }
}

export async function deleteWarehouseProduct(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        const product = await prisma.warehouseProduct.findUnique({ where: { id } });
        if (!product) {
            return { success: false, error: "Product not found" };
        }

        await prisma.warehouseProduct.delete({
            where: { id },
        });

        revalidatePath(`/warehouses`);
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting warehouse product:", error);
        return { success: false, error: error.message || "Failed to delete product" };
    }
}

export async function transferToInventory(
    warehouseProductId: string,
    destination: "quantity" | "warehouse",
    quantity: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const warehouseProduct = await prisma.warehouseProduct.findUnique({
            where: { id: warehouseProductId }
        });

        if (!warehouseProduct) {
            return { success: false, error: "Warehouse product not found" };
        }

        if (quantity <= 0 || quantity > warehouseProduct.quantity) {
            return { success: false, error: "Invalid transfer quantity" };
        }

        // Check if product exists in inventory by productId (preferred) or SKU
        let inventoryProduct = null;
        if ((warehouseProduct as any).productId) {
            inventoryProduct = await prisma.product.findUnique({
                where: { id: (warehouseProduct as any).productId }
            });
        }

        if (!inventoryProduct) {
            inventoryProduct = await prisma.product.findFirst({
                where: { sku: warehouseProduct.sku }
            });

            // If found by SKU, backfill the link
            if (inventoryProduct) {
                await prisma.warehouseProduct.update({
                    where: { id: warehouseProduct.id },
                    data: { productId: inventoryProduct.id }
                });
            }
        }

        if (inventoryProduct) {
            // Update existing product quantity
            const updateData: any = {};
            updateData[destination] = (inventoryProduct as any)[destination] + quantity;

            // Update batchId if provided from warehouse
            if (warehouseProduct.batchId) {
                updateData.batchId = warehouseProduct.batchId;
            }

            // Update alertStock to match warehouse product (fixes legacy default of 10)
            updateData.alertStock = warehouseProduct.alertStock || 0;

            await prisma.product.update({
                where: { id: inventoryProduct.id },
                data: updateData
            });
        } else {
            // Create new product in inventory
            const productData: any = {
                name: warehouseProduct.productName,
                sku: warehouseProduct.sku,
                cost: warehouseProduct.cost,
                retailPrice: warehouseProduct.retailPrice,
                images: warehouseProduct.images,
                quantity: 0,
                // branch2 removed
                warehouse: 0,
                alertStock: warehouseProduct.alertStock || 0,
                batchId: warehouseProduct.batchId || null,
            };
            productData[destination] = quantity;

            const newProduct = await prisma.product.create({ data: productData });

            // Link the warehouse product to the new inventory product
            await prisma.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { productId: newProduct.id }
            });
        }

        // Reduce quantity in warehouse
        const newQuantity = warehouseProduct.quantity - quantity;

        if (newQuantity === 0) {
            // Delete warehouse product if quantity reaches 0
            await prisma.warehouseProduct.delete({
                where: { id: warehouseProductId }
            });
        } else {
            // Update warehouse product quantity
            await prisma.warehouseProduct.update({
                where: { id: warehouseProductId },
                data: { quantity: newQuantity }
            });
        }

        // Log warehouse product transfer out
        await createInventoryLog({
            action: "TRANSFER_OUT",
            warehouseProductId: warehouseProductId,
            quantityChange: -quantity,
            previousStock: warehouseProduct.quantity,
            newStock: newQuantity,
            reason: `Transfer to inventory`,
            referenceId: warehouseProductId,
        });

        // Log inventory product transfer in
        const finalProduct = inventoryProduct || await prisma.product.findFirst({ where: { sku: warehouseProduct.sku } });
        if (finalProduct) {
            await createInventoryLog({
                action: "TRANSFER_IN",
                productId: finalProduct.id,
                quantityChange: quantity,
                previousStock: (inventoryProduct as any)?.[destination] || 0,
                newStock: ((inventoryProduct as any)?.[destination] || 0) + quantity,
                reason: `Transfer from warehouse`,
                referenceId: warehouseProductId,
            });
        }

        revalidatePath(`/warehouses`);
        revalidatePath('/inventory');
        return { success: true };
    } catch (error: any) {
        console.error("Error transferring to inventory:", error);
        return { success: false, error: error.message || "Failed to transfer product" };
    }
}
