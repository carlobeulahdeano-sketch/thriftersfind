"use server";

import { Product } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function getBodegaProducts(): Promise<Product[]> {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return [];
        }

        const isSuperAdmin = user.role?.name?.toLowerCase() === 'super admin';

        // Only Super Admin can access bodega inventory
        if (!isSuperAdmin) {
            return [];
        }

        const products = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return products.map(product => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            description: product.description || "",
            quantity: product.quantity,
            totalStock: product.quantity,
            alertStock: typeof product.alertStock === 'number' ? product.alertStock : 0,
            cost: typeof product.cost === 'number' ? product.cost : 0,
            retailPrice: typeof product.retailPrice === 'number' ? product.retailPrice : 0,
            images: Array.isArray(product.images) ? (product.images as unknown as string[]) : [],

        }));
    } catch (error) {
        console.error("Error fetching bodega products:", error);
        throw new Error("Failed to fetch bodega products. Please try again later.");
    }
}

export async function createBodegaProduct(productData: Omit<Product, 'id' | 'totalStock'>): Promise<Product> {
    try {
        const user = await getCurrentUser();

        // Only Super Admin can create bodega products
        if (user?.role?.name?.toLowerCase() !== 'super admin') {
            throw new Error("Unauthorized: Only Super Admin can create bodega products");
        }

        const createdBy = user ? {
            uid: user.id,
            name: user.name,
            email: user.email
        } : { uid: "system", name: "System" };

        // Check if SKU already exists
        const existingProduct = await prisma.product.findFirst({
            where: { sku: productData.sku }
        });

        if (existingProduct) {
            throw new Error(`Product with SKU "${productData.sku}" already exists`);
        }

        // Set branch2 and warehouse to 0 as they are no longer used in the UI
        const branch2 = 0;
        const warehouse = 0;
        const totalStock = (productData.quantity || 0);

        // Use Prisma client to create the product
        const newProduct = await prisma.product.create({
            data: {
                name: productData.name,
                sku: productData.sku,
                description: productData.description || null,
                quantity: productData.quantity || 0,
                alertStock: productData.alertStock || 0,
                cost: productData.cost || 0,
                retailPrice: productData.retailPrice || 0,
                images: productData.images ? JSON.parse(JSON.stringify(productData.images)) : [],
                createdBy: createdBy as any,
            } as any
        });

        const id = newProduct.id.toString();

        return {
            id,
            name: productData.name,
            sku: productData.sku,
            description: productData.description || "",
            quantity: productData.quantity || 0,
            totalStock: totalStock,
            alertStock: productData.alertStock || 0,
            cost: productData.cost || 0,
            retailPrice: productData.retailPrice || 0,
            images: productData.images || [],

        };
    } catch (error) {
        console.error("CRITICAL ERROR in createBodegaProduct:", error);
        if (error instanceof Error) {
            console.error("Error Message:", error.message);
            console.error("Error Stack:", error.stack);
        }
        throw error;
    }
}

export async function updateBodegaProduct(id: string | number, productData: Partial<Omit<Product, 'id' | 'totalStock'>>): Promise<Product> {
    try {
        const user = await getCurrentUser();

        // Only Super Admin can update bodega products
        if (user?.role?.name?.toLowerCase() !== 'super admin') {
            throw new Error("Unauthorized: Only Super Admin can update bodega products");
        }

        // If SKU is being updated, check if it already exists (but not for the current product)
        if (productData.sku) {
            const existingProduct = await prisma.product.findFirst({
                where: {
                    sku: productData.sku,
                    id: { not: Number(id) }
                }
            });

            if (existingProduct) {
                throw new Error(`Product with SKU "${productData.sku}" already exists`);
            }
        }

        // Get current product to calculate new totalStock if quantity changes
        const currentProduct = await prisma.product.findUnique({
            where: { id: Number(id) as any }
        });

        if (!currentProduct) {
            throw new Error('Product not found');
        }

        // Use raw query for update to handle potential batchId validation issues
        const updates = [];
        const values = [];

        if (productData.name !== undefined) { updates.push("name = ?"); values.push(productData.name); }
        if (productData.sku !== undefined) { updates.push("sku = ?"); values.push(productData.sku); }
        if (productData.description !== undefined) { updates.push("description = ?"); values.push(productData.description); }
        if (productData.quantity !== undefined) { updates.push("quantity = ?"); values.push(productData.quantity); }
        if (productData.alertStock !== undefined) { updates.push("alertStock = ?"); values.push(productData.alertStock); }
        if (productData.cost !== undefined) { updates.push("cost = ?"); values.push(productData.cost); }
        if (productData.retailPrice !== undefined) { updates.push("retailPrice = ?"); values.push(productData.retailPrice); }
        if (productData.images !== undefined) { updates.push("images = ?"); values.push(JSON.stringify(productData.images)); }


        updates.push("updatedAt = NOW(3)");

        if (updates.length > 0) {
            const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
            values.push(Number(id));
            await prisma.$executeRawUnsafe(sql, ...values);
        }

        const updatedProduct = await prisma.product.findUnique({ where: { id: Number(id) as any } });

        if (!updatedProduct) throw new Error("Failed to retrieve updated product");

        // Cast to any to access quantity before client regen
        const prod = updatedProduct as any;

        return {
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            description: prod.description || "",
            quantity: prod.quantity,
            totalStock: prod.quantity,
            alertStock: prod.alertStock,
            cost: prod.cost,
            retailPrice: prod.retailPrice || 0,
            images: Array.isArray(prod.images) ? (prod.images as unknown as string[]) : [],

        };
    } catch (error) {
        console.error("Error in updateBodegaProduct:", error);
        throw error;
    }
}

export async function deleteBodegaProduct(id: string): Promise<void> {
    try {
        const user = await getCurrentUser();

        // Only Super Admin can delete bodega products
        if (user?.role?.name?.toLowerCase() !== 'super admin') {
            throw new Error("Unauthorized: Only Super Admin can delete bodega products");
        }

        await prisma.product.delete({
            where: { id: Number(id) as any },
        });
    } catch (error) {
        throw new Error(`Failed to delete bodega product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
