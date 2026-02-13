import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Check if relations are available in the current client
    const canInclude = (prisma.user as any).fields?.role?.isRelation;

    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      include: canInclude ? {
        role: true,
        branch: true,
      } : undefined,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform the user data to match the expected format
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      roleId: user.roleId,
      role: user.role ? {
        id: user.role.id,
        name: user.role.name,
        createdAt: user.role.createdAt ? user.role.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: user.role.updatedAt ? user.role.updatedAt.toISOString() : new Date().toISOString(),
      } : null,
      branchId: user.branchId,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.name,
        createdAt: user.branch.createdAt ? user.branch.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: user.branch.updatedAt ? user.branch.updatedAt.toISOString() : new Date().toISOString(),
      } : null,
      permissions: user.permissions,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: transformedUser });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update a specific user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    const { name, email, password, roleId, branchId, permissions } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailCheck = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: userId }
        }
      });

      if (emailCheck) {
        return NextResponse.json(
          { success: false, error: `A user with the email "${email}" already exists.` },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (branchId !== undefined) updateData.branchId = branchId;
    if (permissions !== undefined) updateData.permissions = permissions;

    // Add password update if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Check if relations are available in the current client
    const canInclude = (prisma.user as any).fields?.role?.isRelation;

    // Update user
    const updatedUser = await (prisma.user as any).update({
      where: { id: userId },
      data: updateData,
      include: canInclude ? {
        role: true,
        branch: true,
      } : undefined,
    });

    // Transform the user data
    const transformedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      password: updatedUser.password,
      roleId: updatedUser.roleId,
      role: updatedUser.role ? {
        id: updatedUser.role.id,
        name: updatedUser.role.name,
        createdAt: updatedUser.role.createdAt ? updatedUser.role.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: updatedUser.role.updatedAt ? updatedUser.role.updatedAt.toISOString() : new Date().toISOString(),
      } : null,
      branchId: updatedUser.branchId,
      branch: updatedUser.branch ? {
        id: updatedUser.branch.id,
        name: updatedUser.branch.name,
        createdAt: updatedUser.branch.createdAt ? updatedUser.branch.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: updatedUser.branch.updatedAt ? updatedUser.branch.updatedAt.toISOString() : new Date().toISOString(),
      } : null,
      permissions: updatedUser.permissions,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return NextResponse.json({ success: true, data: transformedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete a specific user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
