
import { prisma } from './src/lib/prisma';

async function main() {
    console.log("Checking last 5 Products:");
    const products = await prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, sku: true, quantity: true, alertStock: true, createdAt: true }
    });
    console.table(products);

    console.log("\nChecking last 5 WarehouseProducts:");
    const whProducts = await prisma.warehouseProduct.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, productName: true, sku: true, quantity: true, alertStock: true, productId: true, createdAt: true }
    });
    console.table(whProducts);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
