"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser, checkPermission } from "@/lib/auth-server";

export interface BranchData {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

export async function getBranches(): Promise<BranchData[]> {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { name: 'asc' }
        });
        return branches;
    } catch (error) {
        console.error("[getBranches] Error:", error);
        return [];
    }
}

export async function createBranch(data: { name: string }): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const hasPerm = await checkPermission('branches');
        if (!hasPerm) return { success: false, error: "Permission denied" };

        if (!data.name) return { success: false, error: "Name is required" };

        // Check if branch name already exists
        const existing = await prisma.branch.findUnique({
            where: { name: data.name }
        });

        if (existing) {
            return { success: false, error: "Branch name already exists" };
        }

        const newBranch = await prisma.branch.create({
            data: {
                name: data.name
            }
        });

        // Admin Logging
        try {
            await (prisma as any).adminLog.create({
                data: {
                    action: 'BRANCH_CREATED',
                    module: 'BRANCHES',
                    description: `Branch "${newBranch.name}" was created.`,
                    performedBy: {
                        uid: user.id,
                        name: user.name,
                        role: user.role?.name || 'Unknown'
                    },
                    targetId: String(newBranch.id),
                    targetType: 'BRANCH',
                    newData: { name: newBranch.name }
                }
            });
        } catch (logError) {
            console.error("Failed to create admin log:", logError);
        }

        revalidatePath("/branches");
        return { success: true };
    } catch (error: any) {
        console.error("[createBranch] Error:", error);
        return { success: false, error: error.message || "Failed to create branch" };
    }
}

export async function updateBranch(id: number, data: { name: string }): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const hasPerm = await checkPermission('branches');
        if (!hasPerm) return { success: false, error: "Permission denied" };

        if (!data.name) return { success: false, error: "Name is required" };

        // Check if branch name already exists for another branch
        const existing = await prisma.branch.findFirst({
            where: {
                name: data.name,
                id: { not: id }
            }
        });

        if (existing) {
            return { success: false, error: "Branch name already exists" };
        }

        const oldBranch = await prisma.branch.findUnique({ where: { id } });

        const updatedBranch = await prisma.branch.update({
            where: { id },
            data: { name: data.name }
        });

        // Admin Logging
        try {
            await (prisma as any).adminLog.create({
                data: {
                    action: 'BRANCH_UPDATED',
                    module: 'BRANCHES',
                    description: `Branch "${updatedBranch.name}" was updated.`,
                    performedBy: {
                        uid: user.id,
                        name: user.name,
                        role: user.role?.name || 'Unknown'
                    },
                    targetId: String(id),
                    targetType: 'BRANCH',
                    previousData: { name: oldBranch?.name },
                    newData: { name: updatedBranch.name }
                }
            });
        } catch (logError) {
            console.error("Failed to create admin log:", logError);
        }

        revalidatePath("/branches");
        return { success: true };
    } catch (error: any) {
        console.error("[updateBranch] Error:", error);
        return { success: false, error: error.message || "Failed to update branch" };
    }
}

export async function deleteBranch(id: number): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, error: "Unauthorized" };

        const hasPerm = await checkPermission('branches');
        if (!hasPerm) return { success: false, error: "Permission denied" };

        const branch = await prisma.branch.findUnique({
            where: { id },
            include: {
                users: true,
                products: true
            }
        });

        if (!branch) return { success: false, error: "Branch not found" };

        if (branch.users.length > 0 || branch.products.length > 0) {
            return {
                success: false,
                error: "Cannot delete branch because it has associated users or products."
            };
        }

        await prisma.branch.delete({
            where: { id }
        });

        // Admin Logging
        try {
            await (prisma as any).adminLog.create({
                data: {
                    action: 'BRANCH_DELETED',
                    module: 'BRANCHES',
                    description: `Branch "${branch.name}" was deleted.`,
                    performedBy: {
                        uid: user.id,
                        name: user.name,
                        role: user.role?.name || 'Unknown'
                    },
                    targetId: String(id),
                    targetType: 'BRANCH',
                    previousData: { name: branch.name }
                }
            });
        } catch (logError) {
            console.error("Failed to create admin log:", logError);
        }

        revalidatePath("/branches");
        return { success: true };
    } catch (error: any) {
        console.error("[deleteBranch] Error:", error);
        return { success: false, error: error.message || "Failed to delete branch" };
    }
}
