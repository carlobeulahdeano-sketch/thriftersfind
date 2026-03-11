"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

type CategoryData = {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
};

export async function getCategories() {
    noStore();
    try {
        const user = await getCurrentUser();
        if (!user) return [];

        const hasPermission =
            (user.role?.name?.toLowerCase() === "super admin") ||
            !!user.permissions?.inventory;
        if (!hasPermission) return [];

        const categories = await prisma.productCategory.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });

        return categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
            imageUrl: c.imageUrl,
            _count: { products: c._count.products },
        }));
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export async function createCategory(data: CategoryData) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.inventory) {
            throw new Error("Permission denied");
        }

        // Check if name already exists
        const existing = await prisma.productCategory.findUnique({
            where: { name: data.name.trim() },
        });
        if (existing) {
            throw new Error(`Category "${data.name}" already exists`);
        }

        const category = await prisma.productCategory.create({
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                imageUrl: data.imageUrl || null,
            },
            include: {
                _count: { select: { products: true } },
            },
        });

        revalidatePath("/inventory");

        return {
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString(),
            _count: { products: category._count.products },
        };
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
}

export async function updateCategory(id: string | number, data: CategoryData) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.inventory) {
            throw new Error("Permission denied");
        }

        // Check if name already exists for another category
        const existing = await prisma.productCategory.findFirst({
            where: {
                name: data.name.trim(),
                NOT: { id: Number(id) },
            },
        });
        if (existing) {
            throw new Error(`Category "${data.name}" already exists`);
        }

        const category = await prisma.productCategory.update({
            where: { id: Number(id) },
            data: {
                name: data.name.trim(),
                description: data.description?.trim() || null,
                imageUrl: data.imageUrl || null,
            },
            include: {
                _count: { select: { products: true } },
            },
        });

        revalidatePath("/inventory");

        return {
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: category.createdAt.toISOString(),
            updatedAt: category.updatedAt.toISOString(),
            _count: { products: category._count.products },
        };
    } catch (error) {
        console.error("Error updating category:", error);
        throw error;
    }
}

export async function deleteCategory(id: string | number) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.permissions?.inventory) {
            throw new Error("Permission denied");
        }

        // Check if category has products
        const category = await prisma.productCategory.findUnique({
            where: { id: Number(id) },
            include: { _count: { select: { products: true } } },
        });

        if (!category) {
            throw new Error("Category not found");
        }

        if (category._count.products > 0) {
            throw new Error(
                `Cannot delete category "${category.name}" because it has ${category._count.products} product(s) assigned to it. Remove the products from this category first.`
            );
        }

        await prisma.productCategory.delete({ where: { id: Number(id) } });

        revalidatePath("/inventory");
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
}
