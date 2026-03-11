const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Finding products to merge...");

    const allProducts = await prisma.$queryRawUnsafe(`
        SELECT id, sku, JSON_UNQUOTE(JSON_EXTRACT(createdBy, '$.uid')) as uid, quantity, categoryId, cost, retailPrice 
        FROM products 
        ORDER BY id ASC
    `);

    const productMap = {};

    for (const p of allProducts) {
        if (!p.sku) continue;
        const uid = p.uid === null ? 'null' : p.uid;
        const key = p.sku.trim() + '_' + uid;
        console.log(`Checking Product ID: ${p.id}, Key: ${key}`);

        if (!productMap[key]) {
            productMap[key] = p;
        } else {
            console.log(`Duplicate found for SKU: ${p.sku}, BranchUID: ${uid}. Merging ID ${p.id} into ID ${productMap[key].id}`);

            // Merge quantity
            const newQty = productMap[key].quantity + p.quantity;

            // Update the original
            await prisma.product.update({
                where: { id: productMap[key].id },
                data: {
                    quantity: newQty,
                    categoryId: productMap[key].categoryId || p.categoryId || null,
                    cost: productMap[key].cost || p.cost || 0,
                    retailPrice: productMap[key].retailPrice || p.retailPrice || 0
                }
            });

            // Update productMap with new quantity
            productMap[key].quantity = newQty;
            if (!productMap[key].categoryId && p.categoryId) productMap[key].categoryId = p.categoryId;

            // Re-assign logs from the duplicate to the original
            await prisma.$executeRawUnsafe(`UPDATE inventory_logs SET productId = ? WHERE productId = ?`, String(productMap[key].id), String(p.id));

            // Delete the duplicate
            await prisma.product.delete({
                where: { id: p.id }
            });
            console.log(`Successfully merged and deleted ID ${p.id}`);
        }
    }
    console.log("Cleanup complete.");
}

main().finally(() => prisma.$disconnect());
