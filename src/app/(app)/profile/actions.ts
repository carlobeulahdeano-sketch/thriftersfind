"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return { error: "Not authenticated" };
        }

        const name = formData.get("displayName") as string;
        const email = formData.get("email") as string;

        if (!name || !email) {
            return { error: "Display name and email are required" };
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                name,
                email,
            },
        });

        revalidatePath("/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        console.error("Error updating profile:", error);
        return { error: "Failed to update profile" };
    }
}
