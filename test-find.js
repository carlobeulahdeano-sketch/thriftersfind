const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const warehouseProduct = await prisma.warehouseProduct.findFirst({ where: { sku: 'W-83-Blue' } });
    console.log('Warehouse Product SKU:', JSON.stringify(warehouseProduct.sku));

    const inventoryProduct = await prisma.product.findFirst({
        where: { sku: warehouseProduct.sku.trim() }
    });
    console.log('Found inventory product trimmed:', inventoryProduct?.id);

    const inventoryProductExact = await prisma.product.findFirst({
        where: { sku: { equals: warehouseProduct.sku.trim() } }
    });
    console.log('Found inventory product equals:', inventoryProductExact?.id);

    const products = await prisma.product.findMany();
    console.log('All product skus:', products.map(p => JSON.stringify(p.sku)));
}

main().finally(() => prisma.$disconnect());
