const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const p6 = await prisma.product.findUnique({ where: { id: 6 } });
    console.log('Product 6:', p6);

    const logs = await prisma.inventoryLog.findMany({
        where: { productId: 6 }
    });
    console.log('Logs for Product 6:', logs);

    const wLogs = await prisma.inventoryLog.findMany({
        where: { warehouseProductId: 2 }
    });
    console.log('Logs for Warehouse Product 2:', wLogs);
}

main().finally(() => prisma.$disconnect());
