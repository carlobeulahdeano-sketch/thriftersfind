'use server'

import { prisma as db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getInventoryLogs(
    page: number = 1,
    pageSize: number = 10,
    filters?: {
        branchId?: string;
        action?: string;
        search?: string;
    }
) {
    try {
        const skip = (page - 1) * pageSize;

        const where: Prisma.InventoryLogWhereInput = {};

        if (filters?.branchId) {
            where.branchId = filters.branchId;
        }

        if (filters?.action) {
            where.action = filters.action;
        }

        if (filters?.search) {
            where.OR = [
                { product: { name: { contains: filters.search } } },
                { product: { sku: { contains: filters.search } } },
                { warehouseProduct: { productName: { contains: filters.search } } },
                { warehouseProduct: { sku: { contains: filters.search } } },
            ];
        }

        const [logs, total] = await Promise.all([
            db.inventoryLog.findMany({
                where,
                include: {
                    product: true,
                    warehouseProduct: true,
                    user: true,
                    branch: true,
                    order: { select: { id: true } },
                    preOrder: { select: { id: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            db.inventoryLog.count({ where }),
        ]);

        return {
            success: true,
            data: logs,
            total,
            totalPages: Math.ceil(total / pageSize),
        };
    } catch (error) {
        console.error("Error fetching inventory logs:", error);
        return { success: false, error: "Failed to fetch inventory logs" };
    }
}
