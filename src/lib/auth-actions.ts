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
            secure: process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_APP_URL?.startsWith('https') === true,
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        // Success
    } catch (error: any) {
        console.error("Login error:", error);
        return { error: "An unexpected error occurred. Please try again." };
    }

    redirect("/dashboard");
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/login");
}
