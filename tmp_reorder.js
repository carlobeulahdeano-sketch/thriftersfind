const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const models = [
    'customers', 'orders', 'notifications', 'batches',
    'product_categories', 'products', 'users', 'messages',
    'branches', 'roles', 'archive_data', 'stations',
    'warehouse_products', 'database_operations', 'sales_logs',
    'admin_logs', 'pre_orders', 'pre_order_items', 'inventory_logs'
];

async function main() {
    console.log('Moving id columns to FIRST position...');
    for (const model of models) {
        try {
            const query = `ALTER TABLE \`${model}\` MODIFY COLUMN id INT AUTO_INCREMENT FIRST;`;
            await prisma.$executeRawUnsafe(query);
            console.log(`OK: \`${model}\` id moved to first`);
        } catch (e) {
            console.error(`Error on ${model}: ${e.message}`);
        }
    }
    console.log('Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
