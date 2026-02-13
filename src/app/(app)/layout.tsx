import React from "react";
import { AppShell } from "./app-shell";
import { User } from "@/lib/types";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/permissions";
import { AccessDenied } from "@/components/access-denied";
import { ReloadButton } from "@/components/reload-button";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session")?.value;

  if (!sessionId) {
    redirect("/login");
  }


  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: sessionId },
      include: {
        role_rel: true,
        branch: true,
      },
    });
  } catch (error) {
    console.error("Database connection error in AppLayout:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Database Connection Error</h1>
        <p className="text-gray-600 mb-4">
          Could not connect to the database. Please ensure your database server (MySQL/XAMPP) is running.
        </p>
        <ReloadButton />
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  const transformedUser: User = {
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
      updatedAt: user.branch.createdAt?.toISOString() || new Date().toISOString(),
    } : null,
    permissions: user.permissions as any,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };

  const headersList = await headers();
  const pathname = headersList.get("x-pathname");
  // Detect if this is a Server Action request
  const isServerAction = headersList.get("next-action");

  if (isServerAction) {
    return <AppShell user={transformedUser}>{children}</AppShell>;
  }

  if (pathname && !hasPermission(pathname, transformedUser.permissions, transformedUser.role?.name)) {
    // If it's the root path and they don't have dashboard access, we should find a path they DO have access to
    // or just show an error. For now, let's redirect to profile as it's always accessible.
    if (pathname === "/" || pathname === "/dashboard") {
      // Find the first permission they have
      const availablePaths = [
        { key: 'orders', path: '/orders' },
        { key: 'batches', path: '/batches' },
        { key: 'inventory', path: '/inventory' },
        { key: 'customers', path: '/customers' },
        { key: 'stations', path: '/stations' },
        { key: 'warehouses', path: '/warehouses' },
        { key: 'preOrders', path: '/pre-orders' },
        { key: 'reports', path: '/reports' },
        { key: 'sales', path: '/sales' },
        { key: 'users', path: '/users' },
        { key: 'settings', path: '/settings' },
      ];

      const firstAvailable = availablePaths.find(p => transformedUser.permissions?.[p.key as keyof typeof transformedUser.permissions]);
      if (firstAvailable) {
        redirect(firstAvailable.path);
      } else {
        redirect("/profile");
      }
    }

    return (
      <AppShell user={transformedUser}>
        <AccessDenied />
      </AppShell>
    );
  }

  return <AppShell user={transformedUser}>{children}</AppShell>;
}
