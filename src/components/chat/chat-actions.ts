"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { createInventoryLog } from "@/lib/inventory-log-helper";

export async function sendMessage(receiverId: string, content: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: currentUser.id,
                receiverId,
            },
        });

        // Revalidate the path to update the UI
        // Ideally we would use a more granular revalidation or a subscription
        revalidatePath("/");

        return { success: true, message };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

export async function getMessages(otherUserId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, error: "Unauthorized" };
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: currentUser.id, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: currentUser.id },
                ],
            },
            orderBy: {
                createdAt: "asc",
            },
            include: {
                sender: {
                    select: { name: true },
                },
            },
        });

        return { success: true, data: messages };
    } catch (error: any) {
        console.error("Failed to fetch messages detailed error:", error);
        if (error instanceof Error) {
            console.error("Stack:", error.stack);
        }
        return { success: false, error: `Failed to fetch messages: ${error.message || "Unknown error"}` };
    }
}

export async function getUnreadCounts() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return {};

        const unreadMessages = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: currentUser.id,
                read: false,
            },
            _count: {
                id: true
            }
        });

        const counts: Record<string, number> = {};
        unreadMessages.forEach(group => {
            counts[group.senderId] = group._count.id;
        });

        return counts;
    } catch (error) {
        console.error("Failed to get unread counts:", error);
        return {};
    }
}

export async function markMessagesAsRead(senderId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return { success: false };

        await prisma.message.updateMany({
            where: {
                senderId: senderId,
                receiverId: currentUser.id,
                read: false
            },
            data: {
                read: true
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Failed to mark messages as read:", error);
        return { success: false };
    }
}

export async function getAllWarehouseProducts() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const products = await prisma.warehouseProduct.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50 // Limit to recent 50 for now to avoid overload
        });
        return products;
    } catch (error) {
        console.error("Failed to fetch warehouse products:", error);
        return [];
    }
}

export async function transferStock(
    warehouseProductId: string,
    quantity?: number,
    targetUser?: { id: string, name: string, email: string }
) {
    console.log(`[transferStock] Initiating transfer for: ${warehouseProductId}, qty: ${quantity}, target: ${targetUser?.name || 'Self'}`);
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            console.error("[transferStock] Unauthorized");
            throw new Error("Unauthorized");
        }

        // Use current user by default, or target user if provided
        const creator = targetUser || {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
        };

        const createdBy = {
            uid: creator.id,
            name: creator.name,
            email: creator.email
        };

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get warehouse product
            const warehouseProducts: any[] = await tx.$queryRawUnsafe(
                `SELECT * FROM warehouse_products WHERE id = ? LIMIT 1`,
                warehouseProductId
            );
            const warehouseProduct = warehouseProducts[0];

            if (!warehouseProduct) {
                console.error("[transferStock] Warehouse product not found:", warehouseProductId);
                throw new Error("Warehouse product not found");
            }

            const transferQty = quantity ?? warehouseProduct.quantity;
            console.log(`[transferStock] Transferring ${transferQty} of ${warehouseProduct.productName}`);

            if (transferQty <= 0 || transferQty > warehouseProduct.quantity) {
                console.error("[transferStock] Invalid quantity:", transferQty, "Available:", warehouseProduct.quantity);
                throw new Error("Invalid transfer quantity");
            }

            // 2. Check if product exists in inventory by SKU (globally unique)
            const inventoryProducts: any[] = await tx.$queryRawUnsafe(
                `SELECT * FROM products WHERE sku = ? LIMIT 1`,
                warehouseProduct.sku
            );
            const inventoryProduct = inventoryProducts[0];

            let productId = '';
            if (inventoryProduct) {
                productId = inventoryProduct.id;
                console.log(`[transferStock] Updating existing product: ${productId}`);
                // Update existing product quantity
                await tx.$executeRawUnsafe(
                    `UPDATE products SET quantity = quantity + ?, updatedAt = NOW(3) WHERE id = ?`,
                    transferQty,
                    productId
                );
            } else {
                productId = `c${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                console.log(`[transferStock] Creating new product in inventory: ${productId}`);
                // Create new product in inventory
                await tx.$executeRawUnsafe(
                    `INSERT INTO products (id, name, sku, description, quantity, warehouseId, alertStock, cost, retailPrice, images, createdBy, createdAt, updatedAt) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
                    productId,
                    warehouseProduct.productName,
                    warehouseProduct.sku,
                    `Transferred from Warehouse Product`,
                    transferQty,
                    null,
                    0,
                    warehouseProduct.cost || 0,
                    warehouseProduct.retailPrice || 0,
                    JSON.stringify(warehouseProduct.images || []),
                    JSON.stringify(createdBy)
                );
            }

            // 2.5 Log inventory change
            // We find the branchId of the target user if possible, or fall back to current user's branch
            // For simplicity, we'll try to get the branchId from the target user's context in the future,
            // but for now we'll use a raw query to find their branchId.
            const targetUserData: any[] = await tx.$queryRawUnsafe(`SELECT branchId FROM users WHERE id = ? LIMIT 1`, creator.id);
            const branchId = targetUserData[0]?.branchId || currentUser.branchId;

            await createInventoryLog({
                action: inventoryProduct ? "ADJUSTMENT" : "STOCK_IN",
                productId: productId,
                quantityChange: transferQty,
                previousStock: inventoryProduct ? (inventoryProduct as any).quantity : 0,
                newStock: (inventoryProduct ? (inventoryProduct as any).quantity : 0) + transferQty,
                reason: `Transferred from Warehouse to ${creator.name}`,
                referenceId: productId,
                branchId: branchId || null,
            }, tx, currentUser);

            // 3. Reduce quantity in warehouse
            const newQuantity = warehouseProduct.quantity - transferQty;
            console.log(`[transferStock] New warehouse quantity: ${newQuantity}`);

            if (newQuantity <= 0) {
                await tx.$executeRawUnsafe(`DELETE FROM warehouse_products WHERE id = ?`, warehouseProductId);
            } else {
                await tx.$executeRawUnsafe(
                    `UPDATE warehouse_products SET quantity = ? WHERE id = ?`,
                    newQuantity,
                    warehouseProductId
                );
            }

            return { success: true };
        });

        revalidatePath('/');
        return result;
    } catch (error: any) {
        console.error("[transferStock] CRITICAL ERROR:", error);
        return { success: false, error: error.message || "Failed to transfer product" };
    }
}

export async function bulkTransferStock(
    warehouseProductIds: string[],
    targetUser?: { id: string, name: string, email: string }
) {
    console.log(`[bulkTransferStock] Initiating bulk transfer for ${warehouseProductIds.length} products to ${targetUser?.name || 'Self'}`);
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const creator = targetUser || {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email
        };

        const createdBy = {
            uid: creator.id,
            name: creator.name,
            email: creator.email
        };

        await prisma.$transaction(async (tx) => {
            // Find target user branch
            const targetUserData: any[] = await tx.$queryRawUnsafe(`SELECT branchId FROM users WHERE id = ? LIMIT 1`, creator.id);
            const branchId = targetUserData[0]?.branchId || currentUser.branchId;

            for (const id of warehouseProductIds) {
                const warehouseProducts: any[] = await tx.$queryRawUnsafe(
                    `SELECT * FROM warehouse_products WHERE id = ? LIMIT 1`,
                    id
                );
                const warehouseProduct = warehouseProducts[0];

                if (!warehouseProduct) continue;

                const transferQty = warehouseProduct.quantity;
                console.log(`[bulkTransferStock] Transferring all (${transferQty}) for ${warehouseProduct.productName}`);

                // Check if product exists in inventory by SKU (globally unique)
                const inventoryProducts: any[] = await tx.$queryRawUnsafe(
                    `SELECT * FROM products WHERE sku = ? LIMIT 1`,
                    warehouseProduct.sku
                );
                const inventoryProduct = inventoryProducts[0];

                let targetProductId = '';
                if (inventoryProduct) {
                    targetProductId = inventoryProduct.id;
                    await tx.$executeRawUnsafe(
                        `UPDATE products SET quantity = quantity + ?, updatedAt = NOW(3) WHERE id = ?`,
                        transferQty,
                        targetProductId
                    );
                } else {
                    targetProductId = `c${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                    await tx.$executeRawUnsafe(
                        `INSERT INTO products (id, name, sku, description, quantity, warehouseId, alertStock, cost, retailPrice, images, createdBy, createdAt, updatedAt) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
                        targetProductId,
                        warehouseProduct.productName,
                        warehouseProduct.sku,
                        `Transferred from Warehouse Product`,
                        transferQty,
                        null,
                        0,
                        warehouseProduct.cost || 0,
                        warehouseProduct.retailPrice || 0,
                        JSON.stringify(warehouseProduct.images || []),
                        JSON.stringify(createdBy)
                    );
                }

                // Log inventory change
                await createInventoryLog({
                    action: inventoryProduct ? "ADJUSTMENT" : "STOCK_IN",
                    productId: targetProductId,
                    quantityChange: transferQty,
                    previousStock: inventoryProduct ? (inventoryProduct as any).quantity : 0,
                    newStock: (inventoryProduct ? (inventoryProduct as any).quantity : 0) + transferQty,
                    reason: `Bulk Transferred from Warehouse to ${creator.name}`,
                    referenceId: targetProductId,
                    branchId: branchId || null,
                }, tx, currentUser);

                // Delete since we transfer all in bulk
                await tx.$executeRawUnsafe(`DELETE FROM warehouse_products WHERE id = ?`, id);
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("[bulkTransferStock] CRITICAL ERROR:", error);
        return { success: false, error: error.message || "Failed to bulk transfer" };
    }
}

export async function getProductBySku(sku: string) {
    try {
        const product = await prisma.product.findUnique({
            where: { sku }
        });
        return product;
    } catch (error) {
        console.error("Error fetching product by SKU:", error);
        return null;
    }
}
