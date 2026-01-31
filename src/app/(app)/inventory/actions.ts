"use server";

import { Product } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { createInventoryLog } from "@/lib/inventory-log-helper";

export async function getProducts(): Promise<Product[]> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const isSuperAdmin = user.role?.name === 'Super Admin';

    // Use raw query to avoid schema validation errors with stale client
    const products: any[] = await prisma.$queryRaw`SELECT * FROM products ORDER BY createdAt DESC`;

    // Filter products based on user role
    const filteredProducts = isSuperAdmin
      ? products
      : products.filter(product => {
        if (!(product as any).createdBy) return false;
        const createdByData = (product as any).createdBy as any;
        return createdByData?.uid === user.id;
      });

    return filteredProducts.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantity: typeof (product as any).quantity === 'number' ? (product as any).quantity : 0,
      warehouseId: (product as any).warehouseId || null,
      totalStock: ((product as any).quantity || 0),
      alertStock: typeof product.alertStock === 'number' ? product.alertStock : 0,
      cost: typeof product.cost === 'number' ? product.cost : 0,
      retailPrice: typeof product.retailPrice === 'number' ? product.retailPrice : 0,
      images: Array.isArray(product.images) ? (product.images as unknown as string[]) : [],
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products. Please try again later.");
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { sku: { contains: query } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantity: product.quantity,
      warehouseId: product.warehouseId,
      totalStock: product.quantity,
      alertStock: product.alertStock,
      cost: product.cost,
      retailPrice: product.retailPrice || 0,
      images: Array.isArray(product.images) ? (product.images as unknown as string[]) : [],
    }));
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

export async function createProduct(productData: Omit<Product, 'id' | 'totalStock'>): Promise<Product> {
  try {
    const user = await getCurrentUser();
    const createdBy = user ? {
      uid: user.id,
      name: user.name,
      email: user.email
    } : { uid: "system", name: "System" };

    // Check if SKU already exists using raw query
    const existingProducts: any[] = await prisma.$queryRaw`SELECT id FROM products WHERE sku = ${productData.sku} LIMIT 1`;
    const existingProduct = existingProducts[0];

    if (existingProduct) {
      throw new Error(`Product with SKU "${productData.sku}" already exists`);
    }

    // Set totalStock based on quantity
    const totalStock = (productData.quantity || 0);
    const id = `c${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    // Use raw query to bypass outdated Prisma client validation for createdBy
    await prisma.$executeRawUnsafe(
      `INSERT INTO products (id, name, sku, description, quantity, warehouseId, alertStock, cost, retailPrice, images, createdBy, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      id,
      productData.name,
      productData.sku,
      productData.description || null,
      productData.quantity || 0,
      productData.warehouseId || null,
      productData.alertStock || 0,
      productData.cost || 0,
      productData.retailPrice || 0,
      JSON.stringify(productData.images || []),
      JSON.stringify(createdBy)
    );

    // Log inventory change
    await createInventoryLog({
      action: "STOCK_IN",
      productId: id,
      quantityChange: productData.quantity || 0,
      previousStock: 0,
      newStock: productData.quantity || 0,
      reason: "Initial stock",
      referenceId: id,
      branchId: user?.branchId || null,
    });

    return {
      id,
      name: productData.name,
      sku: productData.sku,
      description: productData.description || "",
      quantity: productData.quantity || 0,
      warehouseId: productData.warehouseId || null,
      totalStock: totalStock,
      alertStock: productData.alertStock || 0,
      cost: productData.cost || 0,
      retailPrice: productData.retailPrice || 0,
      images: productData.images || [],
    };
  } catch (error) {
    console.error("CRITICAL ERROR in createProduct:", error);
    if (error instanceof Error) {
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    throw error;
  }
}

export async function updateProduct(id: string, productData: Partial<Omit<Product, 'id' | 'totalStock'>>): Promise<Product> {
  try {
    // If SKU is being updated, check if it already exists (but not for the current product)
    if (productData.sku) {
      const existingProducts: any[] = await prisma.$queryRaw`SELECT id FROM products WHERE sku = ${productData.sku} AND id != ${id} LIMIT 1`;
      const existingProduct = existingProducts[0];

      if (existingProduct) {
        throw new Error(`Product with SKU "${productData.sku}" already exists`);
      }
    }

    // Get current product to calculate new totalStock if quantity changes
    const currentProducts: any[] = await prisma.$queryRaw`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    const currentProduct = currentProducts[0];

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
    if (productData.warehouseId !== undefined) { updates.push("warehouseId = ?"); values.push(productData.warehouseId); }
    if (productData.alertStock !== undefined) { updates.push("alertStock = ?"); values.push(productData.alertStock); }
    if (productData.cost !== undefined) { updates.push("cost = ?"); values.push(productData.cost); }
    if (productData.retailPrice !== undefined) { updates.push("retailPrice = ?"); values.push(productData.retailPrice); }
    if (productData.images !== undefined) { updates.push("images = ?"); values.push(JSON.stringify(productData.images)); }

    updates.push("updatedAt = NOW(3)");

    if (updates.length > 0) {
      const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
      values.push(id);
      await prisma.$executeRawUnsafe(sql, ...values);
    }

    const updatedProduct = await prisma.product.findUnique({ where: { id } });

    if (!updatedProduct) throw new Error("Failed to retrieve updated product");

    // Log inventory change if quantity changed
    if (productData.quantity !== undefined && productData.quantity !== currentProduct.quantity) {
      const quantityChange = productData.quantity - currentProduct.quantity;
      await createInventoryLog({
        action: "ADJUSTMENT",
        productId: id,
        quantityChange: quantityChange,
        previousStock: currentProduct.quantity,
        newStock: productData.quantity,
        reason: "Manual adjustment",
        referenceId: id,
      });
    }

    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      sku: updatedProduct.sku,
      description: updatedProduct.description || "",
      quantity: (updatedProduct as any).quantity,
      warehouseId: (updatedProduct as any).warehouseId,
      totalStock: (updatedProduct as any).quantity,
      alertStock: updatedProduct.alertStock,
      cost: updatedProduct.cost,
      retailPrice: updatedProduct.retailPrice || 0,
      images: Array.isArray(updatedProduct.images) ? (updatedProduct.images as unknown as string[]) : [],
    };
  } catch (error) {
    console.error("Error in updateProduct:", error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    // Use raw query to avoid schema validation errors with stale client
    await prisma.$executeRawUnsafe(`DELETE FROM products WHERE id = ?`, id);
  } catch (error) {
    throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
