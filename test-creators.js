const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: { sku: 'W-83-Blue' },
        select: { id: true, createdBy: true }
    });
    console.log('Products:', JSON.stringify(products, null, 2));

    const warehouseProducts = await prisma.warehouseProduct.findMany({
        where: { sku: 'W-83-Blue' },
        select: { id: true, createdBy: true }
    });
    console.log('Warehouse Products:', JSON.stringify(warehouseProducts, null, 2));
}

main().finally(() => prisma.$disconnect());
