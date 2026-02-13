"use server";

import { User, Branch, UserPermissions, Role } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getCurrentUser, checkPermission } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getUsers(): Promise<User[]> {
  try {
    const users = await (prisma.user as any).findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        branch: true,
        role_rel: true
      }
    });

    return users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      role: user.role_rel ? {
        id: user.role_rel.id,
        name: user.role_rel.name,
        createdAt: user.role_rel.createdAt ? user.role_rel.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: user.role_rel.updatedAt ? user.role_rel.updatedAt.toISOString() : new Date().toISOString(),
      } : null,
      branchId: user.branchId,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.name,
        createdAt: user.branch.createdAt ? user.branch.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: user.branch.updatedAt ? user.branch.updatedAt.toISOString() : new Date().toISOString(),
      } : null,
      permissions: user.permissions as UserPermissions | null,
      updatedAt: user.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("[getUsers] Error fetching users:", error);
    return [];
  }
}

export async function getAuthenticatedUser(): Promise<{ user: User | null }> {
  const user = await getCurrentUser();

  return {
    user: user || null,
  };
}

export async function getBranches(): Promise<Branch[]> {
  // Check if the branch model exists in the current client
  if (!(prisma as any).branch) {
    console.warn("Prisma client is out of sync: 'branch' model not found. Please run 'npx prisma generate'.");
    return [];
  }

  const branches = await (prisma as any).branch.findMany({
    orderBy: { name: 'asc' }
  });

  return (branches as any[]).map(branch => ({
    id: branch.id,
    name: branch.name,
    createdAt: branch.createdAt.toISOString(),
    updatedAt: branch.updatedAt.toISOString(),
  }));
}

export async function getRoles(): Promise<Role[]> {
  if (!(prisma as any).role) {
    console.warn("Prisma client is out of sync: 'role' model not found. Please run 'npx prisma generate'.");
    return [];
  }

  const roles = await (prisma as any).role.findMany({
    orderBy: { name: 'asc' }
  });

  return (roles as any[]).map(role => ({
    id: role.id,
    name: role.name,
    createdAt: role.createdAt ? role.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: role.updatedAt ? role.updatedAt.toISOString() : new Date().toISOString(),
  }));
}

export async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
  branchId?: string;
  permissions?: UserPermissions;
}): Promise<{ user: User | null; error?: string }> {
  // 1. Authentication & Permission Check
  const currentUser = await getCurrentUser();
  if (!currentUser) return { user: null, error: "Unauthorized." };

  const hasPermission = await checkPermission('users');
  if (!hasPermission) return { user: null, error: "Permission denied." };

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email }
  });

  if (existingUser) {
    return { user: null, error: `A user with the email "${userData.email}" already exists.` };
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  // Find Role ID if role name is provided
  let roleConnect = undefined;
  if (userData.role) {
    const roleRecord = await (prisma as any).role.findUnique({
      where: { name: userData.role }
    });
    if (roleRecord) {
      roleConnect = { connect: { id: roleRecord.id } };
    }
  }

  // Create user
  // We set `role` string AND `role_rel` relation.
  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role, // Set the legacy string field
      role_rel: roleConnect, // Connect the relation
      branch: userData.branchId && userData.branchId !== 'none' ? { connect: { id: userData.branchId } } : undefined,
      permissions: userData.permissions || undefined,
    } as any,
    include: {
      role_rel: true,
      branch: true
    }
  });

  // 2. Admin Logging
  try {
    await (prisma as any).adminLog.create({
      data: {
        action: 'USER_CREATED',
        module: 'USERS',
        description: `User ${newUser.name} (${newUser.email}) was created.`,
        performedBy: {
          uid: currentUser.id,
          name: currentUser.name,
          role: currentUser.role?.name || 'Unknown'
        },
        targetId: newUser.id,
        targetType: 'USER',
        newData: {
          name: newUser.name,
          email: newUser.email,
          role: (newUser as any).role_rel?.name,
          branch: (newUser as any).branch?.name,
          permissions: newUser.permissions
        },
      }
    });
  } catch (error) {
    console.error("Failed to create admin log:", error);
  }

  const user = newUser as any;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      role: user.role_rel ? {
        id: user.role_rel.id,
        name: user.role_rel.name,
        createdAt: user.role_rel.createdAt.toISOString(),
        updatedAt: user.role_rel.updatedAt.toISOString(),
      } : null,
      branchId: user.branchId,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.name,
        createdAt: user.branch.createdAt.toISOString(),
        updatedAt: user.branch.createdAt.toISOString(),
      } : null,
      permissions: user.permissions as UserPermissions | null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  };
}

export async function updateUser(
  id: string,
  userData: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    roleId?: string;
    branchId?: string;
    permissions?: UserPermissions;
  }
): Promise<{ user: User | null; error?: string }> {
  // 1. Authentication Check
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { user: null, error: "Unauthorized. Please log in." };
  }

  // 2. Permission Check
  // Restricted: Only Super Admin can update others. Users can update themselves.
  const isSelfUpdate = currentUser.id === id;
  const userRoleName = currentUser.role?.name?.toLowerCase() || '';
  const isSuperAdmin = userRoleName === 'super admin';

  console.log('[updateUser] Permissions Check:', {
    currentUserId: currentUser.id,
    targetUserId: id,
    userRoleName: currentUser.role?.name,
    isSelfUpdate,
    isSuperAdmin
  });

  if (!isSelfUpdate && !isSuperAdmin) {
    return {
      user: null,
      error: `Permission Denied. Only Super Admins can update other users. Your role is identified as: '${currentUser.role?.name || 'None'}'`
    };
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      role_rel: true,
      branch: true
    }
  });

  if (!existingUser) {
    return { user: null, error: "User not found." };
  }

  // Check if email is already taken by another user
  const emailCheck = await prisma.user.findFirst({
    where: {
      email: userData.email,
      id: { not: id }
    }
  });

  if (emailCheck) {
    return { user: null, error: `A user with the email "${userData.email}" already exists.` };
  }

  // Find Role connection logic
  let roleConnect = undefined;
  // If roleId is provided, use it directly (preferred)
  if (userData.roleId && userData.roleId !== 'none') {
    roleConnect = { connect: { id: userData.roleId } };
  }
  // Fallback to finding by name if role string is provided (legacy support)
  else if (userData.role) {
    const roleRecord = await (prisma as any).role.findUnique({
      where: { name: userData.role }
    });
    if (roleRecord) {
      roleConnect = { connect: { id: roleRecord.id } };
    }
  }

  console.log('[updateUser] Permissions Payload:', userData.permissions);

  // Prepare update data
  const updateData: any = {
    name: userData.name,
    email: userData.email,
    permissions: userData.permissions,
  };

  if (userData.branchId && userData.branchId !== 'none') {
    updateData.branch = { connect: { id: userData.branchId } };
  } else if (userData.branchId === 'none' || userData.branchId === null) {
    updateData.branch = { disconnect: true };
  }

  // If role is being updated
  if (roleConnect) {
    updateData.role_rel = roleConnect;
  } else if (userData.roleId === 'none') {
    // If explicity set to none/no role
    updateData.role_rel = { disconnect: true };
  }

  // Add password update if provided
  if (userData.password && userData.password.trim() !== '') {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    updateData.password = hashedPassword;
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      role_rel: true,
      branch: true
    }
  });

  // 3. Admin Logging
  try {
    const previousData = {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role_rel?.name,
      branch: existingUser.branch?.name,
      permissions: existingUser.permissions
    };

    const newData = {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role_rel?.name,
      branch: updatedUser.branch?.name,
      permissions: updatedUser.permissions
    };

    await (prisma as any).adminLog.create({
      data: {
        action: 'USER_UPDATED',
        module: 'USERS',
        description: `User ${updatedUser.name} (${updatedUser.email}) was updated.`,
        performedBy: {
          uid: currentUser.id,
          name: currentUser.name,
          role: currentUser.role?.name || 'Unknown'
        },
        targetId: updatedUser.id,
        targetType: 'USER',
        previousData: previousData,
        newData: newData,
      }
    });
  } catch (error) {
    console.error("Failed to create admin log:", error);
    // Don't fail the request if logging fails, just log the error
  }

  // Revalidate to ensure fresh data
  revalidatePath('/users');
  revalidatePath('/', 'layout');

  const user = updatedUser as any;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      role: user.role_rel ? {
        id: user.role_rel.id,
        name: user.role_rel.name,
        createdAt: user.role_rel.createdAt.toISOString(),
        updatedAt: user.role_rel.updatedAt.toISOString(),
      } : null,
      branchId: user.branchId,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.name,
        createdAt: user.branch.createdAt.toISOString(),
        updatedAt: user.branch.createdAt.toISOString(),
      } : null,
      permissions: user.permissions as UserPermissions | null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }
  };
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authentication & Permission Check
    const currentUser = await getCurrentUser();
    if (!currentUser) return { success: false, error: "Unauthorized." };

    const hasPermission = await checkPermission('users');
    if (!hasPermission) return { success: false, error: "Permission denied." };

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return { success: false, error: "User not found." };
    }

    // Delete all transactions (orders) created by this user
    try {
      // Use raw SQL to delete orders with JSON filtering
      const deletedOrders = await prisma.$executeRaw`
        DELETE FROM orders 
        WHERE JSON_EXTRACT(createdBy, '$.uid') = ${id}
      `;
      console.log(`Deleted ${deletedOrders} orders for user ${id}`);
    } catch (dbError) {
      console.error("Error deleting user orders:", dbError);
      // Continue to delete the user even if order deletion fails
    }

    // Cleanup relationships that would prevent user deletion
    // 1. Delete messages where user is sender or receiver
    try {
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: id },
            { receiverId: id }
          ]
        }
      });
    } catch (msgError) {
      console.error("Error deleting user messages:", msgError);
      // Fail here? Or continue? If we can't delete messages, user delete will definitely fail due to FK.
      // We should probably convert this to return error unless we are sure. 
      // But let's let the final delete throw the error if this fails.
    }

    // 2. Anonymize inventory logs (set userId to null)
    try {
      await prisma.inventoryLog.updateMany({
        where: { userId: id },
        data: { userId: null }
      });
    } catch (logError) {
      console.error("Error updating inventory logs:", logError);
    }

    await prisma.user.delete({
      where: { id }
    });

    // 2. Admin Logging
    try {
      await (prisma as any).adminLog.create({
        data: {
          action: 'USER_DELETED',
          module: 'USERS',
          description: `User ${existingUser.name} (${existingUser.email}) was deleted.`,
          performedBy: {
            uid: currentUser.id,
            name: currentUser.name,
            role: currentUser.role?.name || 'Unknown'
          },
          targetId: id,
          targetType: 'USER',
          previousData: {
            name: existingUser.name,
            email: existingUser.email
          }
        }
      });
    } catch (error) {
      console.error("Failed to create admin log:", error);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user." };
  }
}
