"use server";

import { revalidatePath } from "next/cache";
import { Product } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { createInventoryLog } from "@/lib/inventory-log-helper";
import { checkAndNotifyStock } from "./notifications-actions";

import { unstable_noStore as noStore } from "next/cache";
import fs from "fs";
import path from "path";

export async function getProducts(): Promise<Product[]> {
  noStore();
  try {
    const user = await getCurrentUser();

    if (!user) {
      return [];
    }

    const roleName = user.role?.name?.toLowerCase() || "";
    const isSuperAdmin = roleName === "super admin";

    const hasPermission = isSuperAdmin || !!user.permissions?.inventory || !!user.permissions?.preOrders;
    if (!hasPermission) {
      return [];
    }

    const whereClause: any = {};
    
    // Filter by branch if not super admin
    if (!isSuperAdmin && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    // Fetch only IDs sorted by createdAt to bypass MySQL filesort memory limits
    // Apply whereClause here to minimize the number of rows being sorted
    const orderedIds = await prisma.product.findMany({
      where: whereClause,
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    });

    const finalWhereClause: any = { id: { in: orderedIds.map(p => p.id) } };

    const unsortedProducts = await prisma.product.findMany({
      where: finalWhereClause,
      include: {
        category: {
          select: { name: true }
        }
      }
    });

    const productMap = new Map(unsortedProducts.map(p => [p.id, p]));
    const products = orderedIds.map(p => productMap.get(p.id)!).filter(Boolean);

    // Filter products based on user role
    const filteredProducts = products;

    return filteredProducts.map(product => {
      let images: string[] = [];
      try {
        if (Array.isArray(product.images)) {
          images = product.images as unknown as string[];
        } else if (typeof product.images === 'string') {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) images = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse images for product", product.id);
      }

      const categoryName = (product as any).category?.name;

      return {
        id: String(product.id),
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        quantity: typeof (product as any).quantity === 'number' ? (product as any).quantity : 0,
        warehouseId: (product as any).warehouseId || null,
        categoryId: (product as any).categoryId || null,
        category: categoryName && product.categoryId !== null ? { id: product.categoryId as number, name: categoryName, description: null, imageUrl: null, createdAt: '', updatedAt: '' } : null,
        totalStock: ((product as any).quantity || 0),
        alertStock: typeof product.alertStock === 'number' ? product.alertStock : 0,
        cost: typeof product.cost === 'number' ? product.cost : 0,
        retailPrice: typeof product.retailPrice === 'number' ? product.retailPrice : 0,
        images: images,
      };
    });
  } catch (error) {
    const errorLog = `\n--- [${new Date().toISOString()}] Error in getProducts ---\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}\n` +
      `Stack: ${error instanceof Error ? error.stack : 'No stack'}\n` +
      `Prisma error: ${JSON.stringify(error, null, 2)}\n`;
    
    try {
      fs.appendFileSync("c:\\Users\\Carlo Beulah\\Desktop\\thriftersfind\\error_debug.log", errorLog);
    } catch (e) {
      console.error("Failed to write to debug log:", e);
    }

    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products. Please try again later.");
  }
}

export async function getProductNames(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const roleName = user.role?.name?.toLowerCase() || "";
    const isSuperAdmin = roleName === "super admin";

    const whereClause: any = {};
    if (!isSuperAdmin && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    // Fetch all unique product names for the branch (or all if super admin)
    // We remove distinct and orderBy here to prevent filesort memory issues
    // and rely on the client-side deduplication below.
    const products = await prisma.product.findMany({
      where: whereClause,
      select: { name: true },
    });

    // Client-side deduplication to handle case sensitivity and whitespace issues
    // that the database 'distinct' might miss or handle differently
    const uniqueNames = new Set<string>();
    const result: string[] = [];

    for (const p of products) {
      if (!p.name) continue;

      const normalized = p.name.trim().toLowerCase();
      if (!uniqueNames.has(normalized)) {
        uniqueNames.add(normalized);
        result.push(p.name.trim()); // Return the original (trimmed) casing of the first occurrence
      }
    }

    return result.sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching product names:", error);
    return [];
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const roleName = user.role?.name?.toLowerCase() || "";
    const isSuperAdmin = roleName === "super admin";
    
    const whereClause: any = {
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } },
      ],
    };

    if (!isSuperAdmin && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => ({
      id: String(product.id),
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantity: product.quantity,
      totalStock: product.quantity,
      alertStock: typeof product.alertStock === 'number' ? product.alertStock : 0,
      cost: typeof product.cost === 'number' ? product.cost : 0,
      retailPrice: typeof product.retailPrice === 'number' ? product.retailPrice : 0,
      categoryId: product.categoryId,
      categoryName: (product as any).category?.name,
      images: Array.isArray(product.images) ? (product.images as unknown as string[]) : [],
    }));
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}

export async function searchProductsSimple(query: string): Promise<{ id: string; name: string; sku: string; images: string[]; categoryId?: number | null }[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const roleName = user.role?.name?.toLowerCase() || "";
    const isSuperAdmin = roleName === "super admin";

    const whereClause: any = {
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } },
      ],
    };

    if (!isSuperAdmin && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
        categoryId: true,
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return products.map(product => {
      let images: string[] = [];
      try {
        if (Array.isArray(product.images)) {
          images = product.images as unknown as string[];
        } else if (typeof product.images === 'string') {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) images = parsed;
        }
      } catch (e) {
        // ignore
      }
      return {
        id: String(product.id),
        name: product.name,
        sku: product.sku,
        images,
        categoryId: product.categoryId,
      };
    });
  } catch (error) {
    console.error("Error searching products simple:", error);
    return [];
  }
}

export async function getLowStockProducts(): Promise<Product[]> {
  noStore();
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const roleName = user.role?.name?.toLowerCase() || "";
    const isSuperAdmin = roleName === "super admin";

    const whereClause: any = {
      alertStock: {
        gt: 0,
      },
    };

    if (!isSuperAdmin && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    // Fetch only necessary fields to bypass MySQL filesort memory limits
    const orderedProducts = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        alertStock: true,
        quantity: true,
      },
      orderBy: {
        quantity: 'asc',
      },
    });

    // Filter products where quantity <= alertStock
    const lowStockIds = orderedProducts
      .filter(p => p.quantity <= p.alertStock)
      .map(p => p.id);

    if (lowStockIds.length === 0) {
      return [];
    }

    const unsortedProducts = await prisma.product.findMany({
      where: { id: { in: lowStockIds } }
    });

    const productMap = new Map(unsortedProducts.map(p => [p.id, p]));
    const lowStockProducts = lowStockIds.map(id => productMap.get(id)!).filter(Boolean);

    return lowStockProducts.map(product => {
      let images: string[] = [];
      try {
        if (Array.isArray(product.images)) {
          images = product.images as unknown as string[];
        } else if (typeof product.images === 'string') {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) images = parsed;
        }
      } catch (e) {
        console.warn("Failed to parse images for product", product.id);
      }

      return {
        id: String(product.id),
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        quantity: product.quantity,
        warehouseId: product.warehouseId,
        categoryId: product.categoryId,
        totalStock: product.quantity,
        alertStock: typeof product.alertStock === 'number' ? product.alertStock : 0,
        cost: typeof product.cost === 'number' ? product.cost : 0,
        retailPrice: typeof product.retailPrice === 'number' ? product.retailPrice : 0,
        images: images,
      };
    });
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }
}

export async function createProduct(productData: Omit<Product, 'id' | 'totalStock'>): Promise<Product> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.inventory) {
      throw new Error("Permission denied");
    }
    const createdBy = {
      uid: String(user.id),
      name: user.name,
      email: user.email
    };

    const skuToUse = productData.sku.trim();

    // Check if SKU already exists using raw query
    const existingProducts: any[] = await prisma.$queryRaw`SELECT id FROM products WHERE sku = ${skuToUse} LIMIT 1`;
    const existingProduct = existingProducts[0];

    if (existingProduct) {
      throw new Error(`Product with SKU "${skuToUse}" already exists`);
    }

    // Set totalStock based on quantity
    const totalStock = (productData.quantity || 0);

    // Use Prisma client to create the product and get the auto-incremented ID
    const newProduct = await prisma.product.create({
      data: {
        name: productData.name,
        sku: skuToUse,
        description: productData.description || null,
        quantity: productData.quantity || 0,
        warehouseId: productData.warehouseId ? parseInt(productData.warehouseId as any, 10) : null,
        categoryId: (productData as any).categoryId ? parseInt((productData as any).categoryId, 10) : null,
        branchId: user.branchId ? parseInt(String(user.branchId), 10) : null,
        alertStock: productData.alertStock || 0,
        cost: productData.cost || 0,
        retailPrice: productData.retailPrice || 0,
        images: productData.images ? JSON.parse(JSON.stringify(productData.images)) : [],
        createdBy: createdBy as any,
      } as any,
    });

    const id = newProduct.id.toString();

    // Log inventory change
    await createInventoryLog({
      action: "STOCK_IN",
      productId: id,
      quantityChange: productData.quantity || 0,
      previousStock: 0,
      newStock: productData.quantity || 0,
      reason: "Initial stock",
      referenceId: id,
      branchId: user?.branchId ? String(user.branchId) : null,
    });

    revalidatePath("/inventory");
    revalidatePath("/pre-orders");

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
    const user = await getCurrentUser();
    if (!user || !user.permissions?.inventory) {
      throw new Error("Permission denied");
    }
    // If SKU is being updated, check if it already exists (but not for the current product)
    if (productData.sku) {
      const skuToUse = productData.sku.trim();
      const existingProducts: any[] = await prisma.$queryRaw`SELECT id FROM products WHERE sku = ${skuToUse} AND id != ${id} LIMIT 1`;
      const existingProduct = existingProducts[0];

      if (existingProduct) {
        throw new Error(`Product with SKU "${skuToUse}" already exists`);
      }
      productData.sku = skuToUse;
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
    if ((productData as any).categoryId !== undefined) { updates.push("categoryId = ?"); values.push((productData as any).categoryId || null); }

    updates.push("updatedAt = NOW(3)");

    if (updates.length > 0) {
      const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
      values.push(parseInt(id, 10));
      await prisma.$executeRawUnsafe(sql, ...values);
    }

    const updatedProduct = await prisma.product.findUnique({ where: { id: parseInt(id, 10) as any } });

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
        branchId: user?.branchId ? String(user.branchId) : null,
      });

      // Check for low stock notification
      await checkAndNotifyStock({
        productName: updatedProduct.name,
        sku: updatedProduct.sku,
        quantity: (updatedProduct as any).quantity,
        alertStock: updatedProduct.alertStock,
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/pre-orders");

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
    const user = await getCurrentUser();
    if (!user || !user.permissions?.inventory) {
      throw new Error("Permission denied");
    }

    // 1. Get product details before deletion
    const products: any[] = await prisma.$queryRaw`SELECT * FROM products WHERE id = ${id} LIMIT 1`;
    const product = products[0];

    if (!product) {
      // Already deleted or not found
      return;
    }

    // 2. Check if there's a linked warehouse product or match by SKU
    const warehouseProducts: any[] = await prisma.$queryRaw`
        SELECT * FROM warehouse_products 
        WHERE productId = ${id} 
           OR sku = ${product.sku} 
        LIMIT 1
    `;
    const warehouseProduct = warehouseProducts[0];

    if (warehouseProduct) {
      // 3. Return stock to warehouse and clear the link since the product is deleted
      await prisma.$executeRawUnsafe(
        `UPDATE warehouse_products SET quantity = quantity + ?, productId = NULL, updatedAt = NOW(3) WHERE id = ?`,
        product.quantity,
        warehouseProduct.id
      );

      // 4. Log the return
      await createInventoryLog({
        action: "RETURN_TO_WAREHOUSE",
        productId: id,
        warehouseProductId: warehouseProduct.id,
        quantityChange: -product.quantity, // Negative change for branch product
        previousStock: product.quantity,
        newStock: 0,
        reason: "Product deleted from branch, stock returned to warehouse",
        referenceId: id,
        branchId: user?.branchId ? String(user.branchId) : null,
      });

      // Log for warehouse side as well (optional, but good for tracking)
      // We create a log entry linked to warehouseProductId but no productId (since it's being deleted)
      await createInventoryLog({
        action: "STOCK_RETURN",
        warehouseProductId: warehouseProduct.id,
        quantityChange: product.quantity,
        previousStock: warehouseProduct.quantity,
        newStock: warehouseProduct.quantity + product.quantity,
        reason: `Returned from branch deletion (User: ${user?.name || 'Unknown'})`,
        referenceId: id,
        // branchId: null // Warehouse has no branch? Or is it global?
      });
    }

    // 5. Delete the product
    await prisma.$executeRawUnsafe(`DELETE FROM products WHERE id = ?`, parseInt(id, 10));

    revalidatePath("/inventory");
    revalidatePath("/pre-orders");
  } catch (error) {
    throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function bulkAddStock(updates: { productId: string; quantityToAdd: number }[]): Promise<void> {
  try {
    const user = await getCurrentUser();
    if (!user || !user.permissions?.inventory) {
      throw new Error("Permission denied");
    }

    for (const update of updates) {
      const { productId, quantityToAdd } = update;

      if (quantityToAdd <= 0) continue;

      // Get current product
      const currentProducts: any[] = await prisma.$queryRaw`SELECT * FROM products WHERE id = ${productId} LIMIT 1`;
      const currentProduct = currentProducts[0];

      if (!currentProduct) continue;

      const newQuantity = (currentProduct.quantity || 0) + quantityToAdd;

      // Update quantity
      await prisma.$executeRawUnsafe(
        `UPDATE products SET quantity = ?, updatedAt = NOW(3) WHERE id = ?`,
        newQuantity,
        productId
      );

      // Log inventory change
      await createInventoryLog({
        action: "STOCK_IN",
        productId: productId,
        quantityChange: quantityToAdd,
        previousStock: currentProduct.quantity || 0,
        newStock: newQuantity,
        reason: "Bulk stock addition",
        referenceId: productId,
        branchId: user?.branchId ? String(user.branchId) : null,
      });

      // Check for notifications
      await checkAndNotifyStock({
        productName: currentProduct.name,
        sku: currentProduct.sku,
        quantity: newQuantity,
        alertStock: currentProduct.alertStock,
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/pre-orders");
  } catch (error) {
    console.error("Error in bulkAddStock:", error);
    throw error;
  }
}
