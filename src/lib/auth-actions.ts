"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserPermissions } from "./types";

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Email and password are required" };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Invalid email or password" };
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return { error: "Invalid email or password" };
        }

        // In a real app, you'd use a session library or JWT
        // For now, we'll set a simple cookie to simulate a session
        const cookieStore = await cookies();
        cookieStore.set("session", user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') === true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Success
        // Determine where to redirect based on permissions
        const userWithPerms = user as any;
        const permissions = userWithPerms.permissions as UserPermissions;

        if (permissions?.dashboard) {
            redirect("/dashboard");
        }

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

        const firstAvailable = availablePaths.find(p => permissions?.[p.key as keyof UserPermissions]);

        if (firstAvailable) {
            redirect(firstAvailable.path);
        } else {
            redirect("/profile");
        }

    } catch (error: any) {
        if (error.digest?.startsWith('NEXT_REDIRECT')) {
            throw error;
        }
        console.error("Login error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/login");
}
