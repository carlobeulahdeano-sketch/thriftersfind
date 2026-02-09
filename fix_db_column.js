const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking if productId column exists...");
    try {
        // Try to query the column
        await prisma.$queryRaw`SELECT productId FROM warehouse_products LIMIT 1`;
        console.log("productId column already exists.");
    } catch (e) {
        console.log("productId column missing. Adding it...");
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE warehouse_products ADD COLUMN productId VARCHAR(191) NULL`);
            console.log("Added productId column.");

            await prisma.$executeRawUnsafe(`ALTER TABLE warehouse_products ADD INDEX warehouse_products_productId_fkey (productId)`);
            console.log("Added index.");
        } catch (err) {
            console.error("Failed to add column:", err);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
