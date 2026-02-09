"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Success
    } catch (error: any) {
        console.error("Login error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }

    redirect("/inventory");
}

export async function impersonateUser(userId: string) {
    console.log("[Impersonate] Attempting to impersonate user:", userId);
    const cookieStore = await cookies();
    const currentSessionId = cookieStore.get("session")?.value;

    if (!currentSessionId) {
        console.log("[Impersonate] No session found");
        return { error: "You must be logged in to impersonate a user." };
    }

    // Verify the current user is a Super Admin
    // We need to fetch the user to check their role
    const currentUser = await prisma.user.findUnique({
        where: { id: currentSessionId },
        include: { role_rel: true }
    });

    if (!currentUser) {
        console.log("[Impersonate] Current user not found in DB");
        return { error: "Current user not found." };
    }

    const isSuperAdmin = currentUser.role_rel?.name?.toLowerCase() === 'super admin';
    console.log("[Impersonate] Current user role:", currentUser.role_rel?.name, "Is Super Admin:", isSuperAdmin);

    if (!isSuperAdmin) {
        return { error: "Permission denied. Only Super Admins can impersonate users." };
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!targetUser) {
        console.log("[Impersonate] Target user not found");
        return { error: "Target user not found." };
    }

    // Store the original user's ID (impersonator) in a separate cookie BEFORE overwriting the session
    // Only set if we are not already impersonating (to avoid losing the original admin if they impersonate jump)
    const existingImpersonatorId = cookieStore.get("impersonator_id")?.value;
    if (!existingImpersonatorId) {
        cookieStore.set("impersonator_id", currentSessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });
    }

    // Set the session cookie to the target user's ID
    cookieStore.set("session", userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });

    console.log("[Impersonate] Session cookie set. Redirecting...");
    redirect("/inventory");
}

export async function stopImpersonating() {
    const cookieStore = await cookies();
    const impersonatorId = cookieStore.get("impersonator_id")?.value;

    if (!impersonatorId) {
        return { error: "No active impersonation session found." };
    }

    // Restore the original session
    cookieStore.set("session", impersonatorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });

    // Remove the impersonator_id cookie
    cookieStore.delete("impersonator_id");

    console.log("[Stop Impersonating] Session restored to admin. Redirecting...");
    redirect("/users");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    cookieStore.delete("impersonator_id");
    redirect("/login");
}
