const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting to empty all tables except users...');

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
        // 'users', // EXCLUDED: We want to keep user data
        'customers',
        'roles',
        'branches'
    ];

    try {
        // Disable foreign key checks for MySQL
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

        for (const table of tables) {
            console.log(`Emptying table: ${table}`);
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
            } catch (tableError) {
                console.error(`Failed to truncate table ${table}:`, tableError);
            }
        }

        // Re-enable foreign key checks
        await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');

        console.log('Successfully emptied specified tables.');
        console.log('Note: The "users" table was preserved.');
        console.log('Warning: "roles" and "branches" were cleared. User relations might be broken.');
    } catch (error) {
        console.error('Error emptying tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
