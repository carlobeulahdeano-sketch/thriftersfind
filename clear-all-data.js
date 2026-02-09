const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting to empty all tables...');

    const tables = [
        'inventory_logs',
        'pre_order_items',
        'pre_orders',
        'admin_logs',
        'sales_logs',
        'database_operations',
        'warehouse_products',
        'stations',
        'archive_data',
        'messages',
        'notifications',
        'orders',
        'products',
        'batches',
        'users',
        'customers',
        'roles',
        'branches'
    ];

    try {
        // Disable foreign key checks for MySQL
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

        for (const table of tables) {
            console.log(`Emptying table: ${table}`);
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
        }

        // Re-enable foreign key checks
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

        console.log('Successfully emptied all tables.');
        console.log('You may want to run "node seed-all.js" to restore the admin user.');
    } catch (error) {
        console.error('Error emptying tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
