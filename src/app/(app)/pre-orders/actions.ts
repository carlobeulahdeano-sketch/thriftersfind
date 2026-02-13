"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export interface PreOrderItem {
    productId?: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    images?: string[];
}

export interface CreatePreOrderData {
    customerName: string;
    contactNumber?: string;
    address?: string;
    orderDate?: string;
    totalAmount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    depositAmount?: number;
    customerId: string;
    customerEmail?: string;
    remarks?: string;
    items: PreOrderItem[];
    batchId?: string;
}

export async function getPreOrders() {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.preOrders) {
            throw new Error("Unauthorized");
        }

        const isSuperAdmin = user.role?.name === "Super Admin";

        const preOrders = await prisma.preOrder.findMany({
            where: isSuperAdmin
                ? {}
                : {
                    createdBy: {
                        path: "$.uid",
                        equals: user.id,
                    },
                },
            include: {
                customer: true,
                items: true,
                batch: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Map to PreOrder type structure
        return preOrders.map(order => ({
            ...order,
            customer: (order as any).customer ? {
                id: (order as any).customer.id,
                name: (order as any).customer.name,
                email: (order as any).customer.email,
                phone: (order as any).customer.phone || "",
                avatar: (order as any).customer.avatar || "",
                address: (order as any).customer.street ? {
                    street: (order as any).customer.street,
                    city: (order as any).customer.city || "",
                    state: (order as any).customer.state || "",
                    zip: (order as any).customer.zip || "",
                } : {
                    street: "",
                    city: "",
                    state: "",
                    zip: "",
                },
                orderHistory: [],
                totalSpent: 0,
            } : undefined,
            items: order.items,
            batchId: order.batchId,
            batch: (order as any).batch
        }));
    } catch (error) {
        console.error("Failed to fetch pre-orders:", error);
        throw new Error("Failed to fetch pre-orders");
    }
}

export async function createPreOrder(data: CreatePreOrderData) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.preOrders) {
            throw new Error("Unauthorized");
        }

        // Create pre-order with items and inventory allocations in a transaction
        const preOrder = await prisma.$transaction(async (tx) => {
            // Create the pre-order
            const newPreOrder = await tx.preOrder.create({
                data: {
                    customerName: data.customerName,
                    contactNumber: data.contactNumber,
                    address: data.address,
                    orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
                    totalAmount: data.totalAmount,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus || "Unpaid",
                    depositAmount: data.depositAmount || 0,
                    customerId: data.customerId,
                    customerEmail: data.customerEmail,
                    remarks: data.remarks,
                    createdBy: {
                        uid: user.id,
                        name: user.name,
                    },
                    batchId: data.batchId && data.batchId !== 'none' ? data.batchId : null,
                },
            });

            // Update Batch Totals ONLY if paymentStatus is 'Paid'
            if (data.paymentStatus === 'Paid' && data.batchId && data.batchId !== 'none') {
                const batch = await tx.batch.findUnique({ where: { id: data.batchId } });
                if (batch) {
                    await tx.batch.update({
                        where: { id: data.batchId },
                        data: {
                            totalOrders: (batch.totalOrders || 0) + 1,
                            totalSales: (batch.totalSales || 0) + data.totalAmount
                        }
                    });
                }
            }

            // Create pre-order items
            // Create pre-order items
            const finalItemsData = data.items.map((item) => ({
                preOrderId: newPreOrder.id,
                productName: item.productName,
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                totalPrice: item.quantity * item.pricePerUnit,
                images: item.images // Prisma handles Json type automatically
            }));

            await tx.preOrderItem.createMany({
                data: finalItemsData,
            });

            return newPreOrder;
        });

        revalidatePath("/pre-orders");
        return preOrder;
    } catch (error) {
        console.error("Failed to create pre-order:", error);
        throw new Error("Failed to create pre-order");
    }
}

export async function updatePreOrder(
    id: string,
    data: Partial<CreatePreOrderData>
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error("Unauthorized");
        }

        const preOrder = await prisma.$transaction(async (tx) => {
            const existingPreOrder = await tx.preOrder.findUnique({ where: { id } });
            if (!existingPreOrder) throw new Error("Pre-order not found");

            const wasPaid = existingPreOrder.paymentStatus === 'Paid';
            const isNowPaid = data.paymentStatus === 'Paid' || (data.paymentStatus === undefined && wasPaid);

            const oldBatchId = existingPreOrder.batchId;
            const newBatchId = data.batchId !== undefined ? (data.batchId === 'none' ? null : data.batchId) : oldBatchId;

            const oldAmount = existingPreOrder.totalAmount;
            const newAmount = data.totalAmount !== undefined ? data.totalAmount : oldAmount;

            const isValidBatch = (bid: string | null) => bid && bid !== 'none';

            // Status transitions
            if (wasPaid && !isNowPaid) {
                if (isValidBatch(oldBatchId)) {
                    const batch = await tx.batch.findUnique({ where: { id: oldBatchId! } });
                    if (batch) {
                        await tx.batch.update({
                            where: { id: oldBatchId! },
                            data: {
                                totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
                                totalSales: Math.max(0, (batch.totalSales || 0) - oldAmount)
                            }
                        });
                    }
                }
            } else if (!wasPaid && isNowPaid) {
                if (isValidBatch(newBatchId)) {
                    const batch = await tx.batch.findUnique({ where: { id: newBatchId! } });
                    if (batch) {
                        await tx.batch.update({
                            where: { id: newBatchId! },
                            data: {
                                totalOrders: (batch.totalOrders || 0) + 1,
                                totalSales: (batch.totalSales || 0) + newAmount
                            }
                        });
                    }
                }
            } else if (wasPaid && isNowPaid) {
                if (oldBatchId !== newBatchId) {
                    if (isValidBatch(oldBatchId)) {
                        const batch = await tx.batch.findUnique({ where: { id: oldBatchId! } });
                        if (batch) {
                            await tx.batch.update({
                                where: { id: oldBatchId! },
                                data: {
                                    totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
                                    totalSales: Math.max(0, (batch.totalSales || 0) - oldAmount)
                                }
                            });
                        }
                    }
                    if (isValidBatch(newBatchId)) {
                        const batch = await tx.batch.findUnique({ where: { id: newBatchId! } });
                        if (batch) {
                            await tx.batch.update({
                                where: { id: newBatchId! },
                                data: {
                                    totalOrders: (batch.totalOrders || 0) + 1,
                                    totalSales: (batch.totalSales || 0) + newAmount
                                }
                            });
                        }
                    }
                } else if (oldAmount !== newAmount) {
                    if (isValidBatch(newBatchId)) {
                        const batch = await tx.batch.findUnique({ where: { id: newBatchId! } });
                        if (batch) {
                            await tx.batch.update({
                                where: { id: newBatchId! },
                                data: {
                                    totalSales: (batch.totalSales || 0) + (newAmount - oldAmount)
                                }
                            });
                        }
                    }
                }
            }

            return await tx.preOrder.update({
                where: { id },
                data: {
                    customerName: data.customerName,
                    contactNumber: data.contactNumber,
                    address: data.address,
                    orderDate: data.orderDate ? new Date(data.orderDate) : undefined,
                    totalAmount: data.totalAmount,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus,
                    depositAmount: data.depositAmount,
                    customerEmail: data.customerEmail,
                    remarks: data.remarks,
                    batchId: data.batchId && data.batchId !== 'none' ? data.batchId : (data.batchId === 'none' ? null : undefined),
                },
            });
        });

        revalidatePath("/pre-orders");
        return preOrder;
    } catch (error) {
        console.error("Failed to update pre-order:", error);
        throw new Error("Failed to update pre-order");
    }
}

export async function deletePreOrder(id: string) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.preOrders) {
            throw new Error("Unauthorized");
        }

        // Delete pre-order (items and inventory will be cascade deleted)
        // Revert batch stats if it was Paid
        await prisma.$transaction(async (tx) => {
            const preOrder = await tx.preOrder.findUnique({ where: { id } });
            if (preOrder && preOrder.paymentStatus === 'Paid' && preOrder.batchId && preOrder.batchId !== 'none') {
                const batch = await tx.batch.findUnique({ where: { id: preOrder.batchId } });
                if (batch) {
                    await tx.batch.update({
                        where: { id: preOrder.batchId },
                        data: {
                            totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
                            totalSales: Math.max(0, (batch.totalSales || 0) - preOrder.totalAmount)
                        }
                    });
                }
            }
            await tx.preOrder.delete({
                where: { id },
            });
        });

        revalidatePath("/pre-orders");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete pre-order:", error);
        throw new Error("Failed to delete pre-order");
    }
}

// [NEW] Action to support Inventory Page list
export async function getPreOrderItems() {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.preOrders) {
            throw new Error("Unauthorized");
        }

        const items = await prisma.preOrderItem.findMany({
            include: {
                preOrder: {
                    select: {
                        customerName: true,
                        batch: {
                            select: { batchName: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return items;
    } catch (error) {
        console.error("Failed to fetch pre-order items:", error);
        throw new Error("Failed to fetch pre-order items");
    }
}

export async function recordPreOrderPayment(preOrderId: string, amount: number) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            throw new Error("Unauthorized");
        }

        // Fetch the current pre-order
        const preOrder = await prisma.preOrder.findUnique({
            where: { id: preOrderId },
        });

        if (!preOrder) {
            throw new Error("Pre-order not found");
        }

        // Calculate new deposit amount
        const newDepositAmount = (preOrder.depositAmount || 0) + amount;

        // Determine payment status
        let paymentStatus = "Partial";
        if (newDepositAmount >= preOrder.totalAmount) {
            paymentStatus = "Paid";
        } else if (newDepositAmount === 0) {
            paymentStatus = "Unpaid";
        }

        // Update the pre-order and manage batch stats if it becomes Paid
        const updatedPreOrder = await prisma.$transaction(async (tx) => {
            const upo = await tx.preOrder.update({
                where: { id: preOrderId },
                data: {
                    depositAmount: newDepositAmount,
                    paymentStatus,
                },
            });

            const wasPaidBefore = preOrder.paymentStatus === 'Paid';
            const isPaidNow = paymentStatus === 'Paid';

            if (!wasPaidBefore && isPaidNow && upo.batchId && upo.batchId !== 'none') {
                const batch = await tx.batch.findUnique({ where: { id: upo.batchId } });
                if (batch) {
                    await tx.batch.update({
                        where: { id: upo.batchId },
                        data: {
                            totalOrders: (batch.totalOrders || 0) + 1,
                            totalSales: (batch.totalSales || 0) + upo.totalAmount
                        }
                    });
                }
            } else if (wasPaidBefore && !isPaidNow && upo.batchId && upo.batchId !== 'none') {
                const batch = await tx.batch.findUnique({ where: { id: upo.batchId } });
                if (batch) {
                    await tx.batch.update({
                        where: { id: upo.batchId },
                        data: {
                            totalOrders: Math.max(0, (batch.totalOrders || 0) - 1),
                            totalSales: Math.max(0, (batch.totalSales || 0) - upo.totalAmount)
                        }
                    });
                }
            }

            return upo;
        });

        revalidatePath("/pre-orders");
        return updatedPreOrder;
    } catch (error) {
        console.error("Failed to record payment:", error);
        throw new Error("Failed to record payment");
    }
}

export async function createPreOrderProduct(data: any) {
    // Placeholder to satisfy component requirements
    // In a real scenario, this would create a product entry for pre-orders
    console.log("Creating pre-order product:", data);
    return { success: true };
}
