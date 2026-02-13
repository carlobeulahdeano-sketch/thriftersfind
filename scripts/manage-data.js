const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const command = args[0]; // 'list' or 'clear'
    const tableName = args[1]; // table name or 'all'

    if (!command) {
        console.log("Usage: node scripts/manage-data.js [list|clear] [tableName|all]");
        process.exit(1);
    }

    try {
        const tables = [
            'Customer', 'Order', 'Notification', 'Batch', 'Product',
            'User', 'Message', 'Branch', 'Role', 'ArchiveData',
            'Station', 'WarehouseProduct', 'DatabaseOperation',
            'SalesLog', 'AdminLog', 'PreOrder', 'PreOrderItem', 'InventoryLog'
        ];

        if (command === 'list') {
            console.log("Current Record Counts:");
            for (const table of tables) {
                const count = await prisma[table.charAt(0).toLowerCase() + table.slice(1)].count();
                console.log(`- ${table}: ${count}`);
            }
        } else if (command === 'clear') {
            if (!tableName) {
                console.log("Please specify a table name or 'all' (to clear all except Users).");
                process.exit(1);
            }

            if (tableName === 'all') {
                console.log("Clearing all tables except User, Branch, and Role (standard setup)...");

                // Order matters due to foreign keys if not using TRUNCATE with CASCADE
                // But Prisma deleteMany is easier for small/medium DBs without manual SQL.
                // We'll clear them in reverse order of dependencies generally.

                const tablesToClear = [
                    'inventoryLog', 'salesLog', 'adminLog', 'databaseOperation',
                    'preOrderItem', 'preOrder', 'message', 'notification',
                    'order', 'archiveData', 'product', 'warehouseProduct',
                    'batch', 'customer'
                ];

                for (const table of tablesToClear) {
                    const { count } = await prisma[table].deleteMany({});
                    console.log(`Cleared ${count} records from ${table}.`);
                }
            } else {
                // Clear specific table
                const lowerTable = tableName.charAt(0).toLowerCase() + tableName.slice(1);
                if (prisma[lowerTable]) {
                    const { count } = await prisma[lowerTable].deleteMany({});
                    console.log(`Cleared ${count} records from ${tableName}.`);
                } else {
                    console.error(`Table ${tableName} not found in Prisma client.`);
                }
            }
        }
    } catch (e) {
        console.error("Error managing data:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
