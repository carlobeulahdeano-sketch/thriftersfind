import React from "react";
import { AppShell } from "./app-shell";
import { User, UserPermissions } from "@/lib/types";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
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
  const rawPathname = headersList.get("x-pathname") || "";

  // Detect if this is a Server Action request
  const isServerAction = headersList.get("next-action");

  if (isServerAction) {
    return <AppShell user={transformedUser}>{children}</AppShell>;
  }

  // FAIL-SAFE: If rawPathname is missing, we don't know the path.
  // Instead of risking a redirect loop, we render the page and 
  // let the client-side permission checks in the pages handle it.
  if (!rawPathname) {
    return <AppShell user={transformedUser}>{children}</AppShell>;
  }

  // Normalize pathname for permission check
  const pathname = rawPathname === '/' ? '/' : rawPathname.replace(/\/$/, '');

  const isAuthorized = hasPermission(pathname, transformedUser.permissions, transformedUser.role?.name);

  if (!isAuthorized) {
    console.log(`[Auth] Access denied for user ${transformedUser.email} to path: "${pathname}"`);

    // ONLY redirect if we definitely know we are on a "root-like" path that needs a redirect
    if (pathname === "/" || pathname === "/dashboard" || pathname === "") {
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

      const firstAvailable = availablePaths.find(p => transformedUser.permissions?.[p.key as keyof UserPermissions]);

      if (firstAvailable) {
        // Safety check: Don't redirect if we're already at the target path
        if (pathname === firstAvailable.path) {
          return (
            <AppShell user={transformedUser}>
              <AccessDenied />
            </AppShell>
          );
        }

        redirect(firstAvailable.path);
      } else {
        redirect("/profile");
      }
    }

    // Default to showing Access Denied if not authorized and not on a redirectable root path
    return (
      <AppShell user={transformedUser}>
        <AccessDenied />
      </AppShell>
    );
  }

  return <AppShell user={transformedUser}>{children}</AppShell>;
}
