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
            if (linkedProduct) finalProductId = String(linkedProduct.id);
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
                productId: finalProductId ? Number(finalProductId) : null,
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
        const product = await prisma.warehouseProduct.findUnique({ where: { id: Number(id) } });
        if (!product) {
            return { success: false, error: "Product not found" };
        }

        // If SKU is being updated, check for duplicates
        if (data.sku && data.sku !== product.sku) {
            const existing = await prisma.warehouseProduct.findFirst({
                where: {
                    sku: data.sku,
                    NOT: { id: Number(id) }
                }
            });

            if (existing) {
                return { success: false, error: "A product with this SKU already exists in this warehouse" };
            }
        }

        await prisma.warehouseProduct.update({
            where: { id: Number(id) },
            data: {
                ...(data.productName !== undefined && { productName: data.productName }),
                ...(data.sku !== undefined && { sku: data.sku }),
                ...(data.quantity !== undefined && { quantity: data.quantity }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.cost !== undefined && { cost: data.cost }),
                ...(data.retailPrice !== undefined && { retailPrice: data.retailPrice }),
                ...(data.images !== undefined && { images: data.images }),
                ...(data.productId !== undefined && { productId: data.productId ? Number(data.productId) : null }),
            },
        });

        revalidatePath(`/warehouses`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating warehouse product:", error);
        return { success: false, error: error.message || "Failed to update product" };
    }
}

export async function deleteWarehouseProduct(id: string | number): Promise<{ success: boolean; error?: string }> {
    try {
        const product = await prisma.warehouseProduct.findUnique({ where: { id: Number(id) } });
        if (!product) {
            return { success: false, error: "Product not found" };
        }

        await prisma.warehouseProduct.delete({
            where: { id: Number(id) },
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
            where: { id: Number(warehouseProductId) }
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
            const skuToFind = warehouseProduct.sku.trim();
            inventoryProduct = await prisma.product.findFirst({
                where: {
                    sku: {
                        equals: skuToFind
                    }
                }
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

            // Fix: Map 'warehouse' destination to 'quantity' since the field doesn't exist in the Product model
            // This prevents the 'NaN' issues and duplication when 'destination' is 'warehouse'
            const targetField = "quantity";
            updateData[targetField] = (inventoryProduct.quantity || 0) + quantity;

            // Sync other details per user request: "the same details will also add"
            if (!inventoryProduct.categoryId) updateData.categoryId = (warehouseProduct as any).categoryId;
            if (inventoryProduct.cost === 0 || !inventoryProduct.cost) updateData.cost = warehouseProduct.cost;
            if (!inventoryProduct.retailPrice) updateData.retailPrice = warehouseProduct.retailPrice;

            // Sync images if empty
            let hasImages = false;
            try {
                const images = inventoryProduct.images;
                if (Array.isArray(images) && images.length > 0) hasImages = true;
                else if (typeof images === 'string' && JSON.parse(images).length > 0) hasImages = true;
            } catch (e) { }

            if (!hasImages) {
                updateData.images = warehouseProduct.images;
            }

            // Update batchId if provided from warehouse
            if (warehouseProduct.batchId) {
                updateData.batchId = warehouseProduct.batchId;
            }

            // Update alertStock to match warehouse product
            updateData.alertStock = warehouseProduct.alertStock || 0;

            await prisma.product.update({
                where: { id: inventoryProduct.id },
                data: updateData
            });
        } else {
            // Create new product in inventory
            const productData: any = {
                name: warehouseProduct.productName,
                sku: warehouseProduct.sku.trim(),
                cost: warehouseProduct.cost,
                retailPrice: warehouseProduct.retailPrice,
                images: warehouseProduct.images,
                quantity: quantity, // Fixed: use quantity directly
                alertStock: warehouseProduct.alertStock || 0,
                batchId: warehouseProduct.batchId || null,
                categoryId: (warehouseProduct as any).categoryId || null,
            };

            const newProduct = await prisma.product.create({ data: productData });

            // Link the warehouse product to the new inventory product
            await prisma.warehouseProduct.update({
                where: { id: warehouseProduct.id },
                data: { productId: newProduct.id }
            });
            // After creating new product, log the id for reference
            const createdProductIdStr = String(newProduct.id);
        }

        // Reduce quantity in warehouse
        const newQuantity = warehouseProduct.quantity - quantity;

        if (newQuantity === 0) {
            // Delete warehouse product if quantity reaches 0
            await prisma.warehouseProduct.delete({
                where: { id: Number(warehouseProductId) }
            });
        } else {
            // Update warehouse product quantity
            await prisma.warehouseProduct.update({
                where: { id: Number(warehouseProductId) },
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
                productId: String(finalProduct.id),
                quantityChange: quantity,
                previousStock: (inventoryProduct as any)?.quantity || 0,
                newStock: ((inventoryProduct as any)?.quantity || 0) + quantity,
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

export async function bulkAddWarehouseStock(
    items: { id: string; quantityToAdd: number }[]
): Promise<{ success: boolean; error?: string }> {
    try {
        if (!items || items.length === 0) {
            return { success: false, error: "No products provided" };
        }

        // Validate quantities
        for (const item of items) {
            if (item.quantityToAdd <= 0) {
                return { success: false, error: "Quantities must be greater than zero" };
            }
        }

        // Use a transaction to ensure all updates succeed or fail together
        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const product = await tx.warehouseProduct.findUnique({
                    where: { id: Number(item.id) }
                });

                if (!product) {
                    throw new Error(`Product with ID ${item.id} not found`);
                }

                const newQuantity = product.quantity + item.quantityToAdd;

                await tx.warehouseProduct.update({
                    where: { id: Number(item.id) },
                    data: { quantity: newQuantity }
                });

                await createInventoryLog({
                    action: "STOCK_IN",
                    warehouseProductId: item.id,
                    quantityChange: item.quantityToAdd,
                    previousStock: product.quantity,
                    newStock: newQuantity,
                    reason: "Bulk Add Stock",
                    referenceId: item.id
                }, tx);
            }
        });

        revalidatePath(`/warehouses`);
        return { success: true };
    } catch (error: any) {
        console.error("Error in bulkAddWarehouseStock:", error);
        return { success: false, error: error.message || "Failed to update stock" };
    }
}
