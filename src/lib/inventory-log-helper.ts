"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { User } from "@/lib/types";

export async function createInventoryLog(params: {
    action: string;
    productId?: string | null;
    warehouseProductId?: string | null;
    quantityChange: number;
    previousStock: number;
    newStock: number;
    reason?: string | null;
    referenceId?: string | null;
    orderId?: string | null;
    preOrderId?: string | null;
    branchId?: string | null;
}, tx?: any, user?: User | null) {
    try {
        const currentUser = user !== undefined ? user : await getCurrentUser();
        const performedBy = currentUser
            ? { uid: currentUser.id, name: currentUser.name, email: currentUser.email }
            : { uid: "system", name: "System" };

        const userId = currentUser?.id || null;
        const userBranchId = params.branchId || currentUser?.branchId || null;

        const data = {
            action: params.action,
            productId: params.productId,
            warehouseProductId: params.warehouseProductId,
            quantityChange: params.quantityChange,
            previousStock: params.previousStock,
            newStock: params.newStock,
            reason: params.reason,
            referenceId: params.referenceId,
            performedBy: performedBy as any,
            orderId: params.orderId,
            preOrderId: params.preOrderId,
            userId: userId,
            branchId: userBranchId,
        };

        if (tx) {
            await tx.inventoryLog.create({ data });
        } else {
            await prisma.inventoryLog.create({ data });
        }
    } catch (error) {
        console.error("Error creating inventory log:", error);
        // Don't throw - logging should not break the main transaction
    }
}
