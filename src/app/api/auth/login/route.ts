import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// POST /api/auth/login - Authenticate user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if relations are available in the current client
    const canInclude = (prisma.user as any).fields?.role_rel?.isRelation;

    const user = await (prisma.user as any).findUnique({
      where: { email },
      include: canInclude ? {
        role_rel: true,
        branch: true,
      } : undefined,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') === true,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    // Transform user data for response
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
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
      permissions: user.permissions,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        user: transformedUser,
        message: 'Login successful'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
