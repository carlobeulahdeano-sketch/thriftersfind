"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { createInventoryLog } from "@/lib/inventory-log-helper";
import { notifyChatEvent } from "@/lib/chat-emitter";

export async function sendMessage(receiverId: string | number, content: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            throw new Error("Unauthorized");
        }

        const message = await prisma.message.create({
            data: {
                content,
                senderId: Number(currentUser.id),
                receiverId: Number(receiverId),
            },
        });

        // Push real-time SSE event to the receiver
        notifyChatEvent(String(receiverId), {
            type: "new-message",
            senderId: String(currentUser.id),
            senderName: currentUser.name,
            messageId: String(message.id),
            content,
            createdAt: message.createdAt.toISOString(),
        });

        // Also notify the sender (for multi-tab support)
        notifyChatEvent(String(currentUser.id), {
            type: "new-message",
            senderId: String(currentUser.id),
            senderName: currentUser.name,
            messageId: String(message.id),
            content,
            createdAt: message.createdAt.toISOString(),
        });

        // Revalidate the path to update the UI
        revalidatePath("/");

        return { success: true, message };
    } catch (error: any) {
        console.error("Failed to send message:", error);
        return { success: false, error: error.message || "Failed to send message" };
    }
}

export async function getMessages(otherUserId: string) {
    noStore();
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, error: "Unauthorized" };
        }

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: Number(currentUser.id), receiverId: Number(otherUserId) },
                    { senderId: Number(otherUserId), receiverId: Number(currentUser.id) },
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
    noStore();
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return {};

        const unreadMessages = await prisma.message.groupBy({
            by: ['senderId'],
            where: {
                receiverId: Number(currentUser.id),
                read: false,
            },
            _count: {
                id: true
            }
        });

        const counts: Record<string, number> = {};
        unreadMessages.forEach(group => {
            counts[String(group.senderId)] = (group._count as any).id;
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

        const result = await prisma.message.updateMany({
            where: {
                senderId: Number(senderId),
                receiverId: Number(currentUser.id),
                read: false
            },
            data: {
                read: true
            }
        });

        if (result.count > 0) {
            revalidatePath('/');
        }
        return { success: true, count: result.count };
    } catch (error) {
        console.error("Failed to mark messages as read:", error);
        return { success: false, count: 0 };
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

            // Check if product exists in inventory by SKU AND createdBy uid (to match branch)
            // Fix: Use JSON_UNQUOTE to handle string/number mismatches in JSON
            const skuToFind = warehouseProduct.sku.trim();
            const inventoryProducts: any[] = await tx.$queryRawUnsafe(
                `SELECT * FROM products WHERE sku = ? AND JSON_UNQUOTE(JSON_EXTRACT(createdBy, '$.uid')) = ? LIMIT 1`,
                skuToFind,
                String(creator.id)
            );
            const inventoryProduct = inventoryProducts[0];

            let productId = '';
            if (inventoryProduct) {
                productId = inventoryProduct.id;
                console.log(`[transferStock] Updating existing product for ${creator.name}: ${productId}`);
                // Update existing product quantity and sync missing details

                let updateQuery = `UPDATE products SET quantity = quantity + ?, updatedAt = NOW(3)`;
                const updateParams: any[] = [transferQty];

                if (!inventoryProduct.categoryId && warehouseProduct.categoryId) {
                    updateQuery += `, categoryId = ?`;
                    updateParams.push(warehouseProduct.categoryId);
                }
                if (!inventoryProduct.cost && warehouseProduct.cost) {
                    updateQuery += `, cost = ?`;
                    updateParams.push(warehouseProduct.cost);
                }
                if (!inventoryProduct.retailPrice && warehouseProduct.retailPrice) {
                    updateQuery += `, retailPrice = ?`;
                    updateParams.push(warehouseProduct.retailPrice);
                }

                // Append the WHERE clause
                updateQuery += ` WHERE id = ?`;
                updateParams.push(productId);

                await tx.$executeRawUnsafe(updateQuery, ...updateParams);
            } else {
                let images = [];
                if (warehouseProduct.image) {
                    images.push(warehouseProduct.image);
                } else if (warehouseProduct.images) {
                    // Handle if images is already a JSON string or object
                    const imgs = typeof warehouseProduct.images === 'string'
                        ? JSON.parse(warehouseProduct.images)
                        : warehouseProduct.images;

                    if (Array.isArray(imgs)) {
                        images = imgs;
                    }
                }

                console.log(`[transferStock] Creating new product in inventory for ${creator.name}`);
                // Create new product in inventory
                const createdProduct = await tx.product.create({
                    data: {
                        name: warehouseProduct.productName,
                        sku: warehouseProduct.sku,
                        description: `Transferred from Warehouse Product`,
                        quantity: transferQty,
                        categoryId: warehouseProduct.categoryId || null,
                        warehouseId: null,
                        alertStock: 10,
                        cost: warehouseProduct.cost || 0,
                        retailPrice: warehouseProduct.retailPrice || 0,
                        images: images as any,
                        createdBy: createdBy as any,
                    }
                });
                productId = String(createdProduct.id);
            }

            // 2.5 Log inventory change
            // We find the branchId of the target user if possible, or fall back to current user's branch
            // For simplicity, we'll try to get the branchId from the target user's context in the future,
            // but for now we'll use a raw query to find their branchId.
            const targetUserData: any[] = await tx.$queryRawUnsafe(`SELECT branchId FROM users WHERE id = ? LIMIT 1`, creator.id);
            const branchId = targetUserData[0]?.branchId || currentUser.branchId;

            await createInventoryLog({
                action: "TRANSFER",
                productId: productId,
                quantityChange: transferQty,
                previousStock: inventoryProduct ? (inventoryProduct as any).quantity : 0,
                newStock: (inventoryProduct ? (inventoryProduct as any).quantity : 0) + transferQty,
                reason: `Transferred from Warehouse to ${creator.name}`,
                referenceId: productId,
                branchId: branchId || null,
            }, tx, currentUser);

            // Log inventory product transfer in
            const finalProduct = inventoryProduct || await prisma.product.findFirst({ where: { sku: warehouseProduct.sku } });

            // Create notification for the transfer
            const now = new Date();
            await tx.notification.create({
                data: {
                    title: "Stock Transfer Received",
                    message: `You received ${transferQty} unit(s) of ${warehouseProduct.productName} from Warehouse.`,
                    type: "transfer",
                    read: false,
                    createdAt: now,
                    updatedAt: now,
                    userId: Number(creator.id)
                }
            });

            // Reduce quantity in warehouse
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
    transfers: { id: string, quantity: number }[],
    targetUser?: { id: string, name: string, email: string }
) {
    console.log(`[bulkTransferStock] Initiating bulk transfer for ${transfers.length} products to ${targetUser?.name || 'Self'}`);
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

            for (const transfer of transfers) {
                const warehouseProducts: any[] = await tx.$queryRawUnsafe(
                    `SELECT * FROM warehouse_products WHERE id = ? LIMIT 1`,
                    transfer.id
                );
                const warehouseProduct = warehouseProducts[0];

                if (!warehouseProduct) continue;

                const transferQty = transfer.quantity;

                if (transferQty <= 0 || transferQty > warehouseProduct.quantity) {
                    console.error(`[bulkTransferStock] Invalid quantity for ${transfer.id}: ${transferQty}`);
                    continue;
                }

                console.log(`[bulkTransferStock] Transferring (${transferQty}) for ${warehouseProduct.productName}`);

                // Check if product exists in inventory by SKU and target User
                const skuToFind = warehouseProduct.sku.trim();
                const inventoryProducts: any[] = await tx.$queryRawUnsafe(
                    `SELECT * FROM products WHERE sku = ? AND JSON_UNQUOTE(JSON_EXTRACT(createdBy, '$.uid')) = ? LIMIT 1`,
                    skuToFind,
                    String(creator.id)
                );
                const inventoryProduct = inventoryProducts[0];

                let targetProductId = '';
                if (inventoryProduct) {
                    targetProductId = inventoryProduct.id;

                    let updateQuery = `UPDATE products SET quantity = quantity + ?, updatedAt = NOW(3)`;
                    const updateParams: any[] = [transferQty];

                    if (!inventoryProduct.categoryId && warehouseProduct.categoryId) {
                        updateQuery += `, categoryId = ?`;
                        updateParams.push(warehouseProduct.categoryId);
                    }
                    if (!inventoryProduct.cost && warehouseProduct.cost) {
                        updateQuery += `, cost = ?`;
                        updateParams.push(warehouseProduct.cost);
                    }
                    if (!inventoryProduct.retailPrice && warehouseProduct.retailPrice) {
                        updateQuery += `, retailPrice = ?`;
                        updateParams.push(warehouseProduct.retailPrice);
                    }

                    updateQuery += ` WHERE id = ?`;
                    updateParams.push(targetProductId);

                    await tx.$executeRawUnsafe(updateQuery, ...updateParams);
                } else {
                    let images = [];
                    if (warehouseProduct.image) {
                        images.push(warehouseProduct.image);
                    } else if (warehouseProduct.images) {
                        // Handle if images is already a JSON string or object
                        const imgs = typeof warehouseProduct.images === 'string'
                            ? JSON.parse(warehouseProduct.images)
                            : warehouseProduct.images;

                        if (Array.isArray(imgs)) {
                            images = imgs;
                        }
                    }

                    const createdProduct = await tx.product.create({
                        data: {
                            name: warehouseProduct.productName,
                            sku: warehouseProduct.sku,
                            description: `Transferred from Warehouse Product`,
                            quantity: transferQty,
                            categoryId: warehouseProduct.categoryId || null,
                            warehouseId: null,
                            alertStock: 10,
                            cost: warehouseProduct.cost || 0,
                            retailPrice: warehouseProduct.retailPrice || 0,
                            images: images as any,
                            createdBy: createdBy as any,
                        }
                    });
                    targetProductId = String(createdProduct.id);
                }

                // Log inventory change
                await createInventoryLog({
                    action: "TRANSFER",
                    productId: targetProductId,
                    quantityChange: transferQty,
                    previousStock: inventoryProduct ? (inventoryProduct as any).quantity : 0,
                    newStock: (inventoryProduct ? (inventoryProduct as any).quantity : 0) + transferQty,
                    reason: `Bulk Transferred from Warehouse to ${creator.name}`,
                    referenceId: targetProductId,
                    branchId: branchId || null,
                }, tx, currentUser);

                // Create notification for the bulk transfer
                const now = new Date();
                await tx.notification.create({
                    data: {
                        title: "Bulk Stock Transfer",
                        message: `You received ${transferQty} unit(s) of ${warehouseProduct.productName} (Bulk Transfer).`,
                        type: "transfer",
                        read: false,
                        createdAt: now,
                        updatedAt: now,
                        userId: Number(creator.id)
                    }
                });

                const newQuantity = warehouseProduct.quantity - transferQty;
                if (newQuantity <= 0) {
                    await tx.$executeRawUnsafe(`DELETE FROM warehouse_products WHERE id = ?`, transfer.id);
                } else {
                    await tx.$executeRawUnsafe(
                        `UPDATE warehouse_products SET quantity = ? WHERE id = ?`,
                        newQuantity,
                        transfer.id
                    );
                }
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error("[bulkTransferStock] CRITICAL ERROR:", error);
        return { success: false, error: error.message || "Failed to bulk transfer" };
    }
}

export async function getProductBySku(sku: string, targetUserId?: string) {
    try {
        let userId = targetUserId;

        if (!userId) {
            const currentUser = await getCurrentUser();
            if (!currentUser) return null;
            userId = String(currentUser.id);
        }

        // Use raw query to match branch-specific product ownership (createdBy.uid)
        const products: any[] = await prisma.$queryRawUnsafe(
            `SELECT * FROM products WHERE sku = ? AND JSON_UNQUOTE(JSON_EXTRACT(createdBy, '$.uid')) = ? LIMIT 1`,
            sku.trim(),
            String(userId)
        );

        return products[0] || null;
    } catch (error) {
        console.error("Error fetching product by SKU:", error);
        return null;
    }
}
