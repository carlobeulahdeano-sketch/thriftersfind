const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Products ---');
    const products = await prisma.product.findMany({
        where: { sku: 'W-83-Blue' },
        select: { id: true, name: true, sku: true, categoryId: true, warehouseId: true, quantity: true, cost: true, retailPrice: true }
    });
    console.table(products);

    console.log('--- Warehouse Products ---');
    const warehouseProducts = await prisma.warehouseProduct.findMany({
        where: { sku: 'W-83-Blue' },
        select: { id: true, productName: true, sku: true, productId: true, quantity: true, categoryId: true }
    });
    console.table(warehouseProducts);
}

main().finally(() => prisma.$disconnect());
