import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { User, UserPermissions } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session")?.value;

    if (!sessionId) {
        return null;
    }

    const user = await (prisma.user as any).findUnique({
        where: { id: sessionId },
        include: {
            role_rel: true,
            branch: true,
        },
    });

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        password: user.password,
        roleId: user.roleId,
        role: user.role_rel ? {
            id: user.role_rel.id,
            name: user.role_rel.name,
            createdAt: user.role_rel.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: user.role_rel.updatedAt?.toISOString() || new Date().toISOString(),
        } : null,
        branchId: user.branchId,
        branch: user.branch ? {
            id: user.branch.id,
            name: user.branch.name,
            createdAt: user.branch.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: user.branch.updatedAt?.toISOString() || new Date().toISOString(),
        } : null,
        permissions: user.permissions as UserPermissions | null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

export async function checkPermission(permission: keyof UserPermissions): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // Explicitly deny Dashboard and Sales for Staff role
    const isStaff = user.role?.name?.toLowerCase() === 'staff';
    if (isStaff && (permission === 'dashboard' || permission === 'sales')) {
        return false;
    }

    return !!user.permissions?.[permission];
}
