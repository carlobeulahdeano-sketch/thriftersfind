const fs = require('fs');

const models = [
    'customers', 'orders', 'notifications', 'batches',
    'product_categories', 'products', 'users', 'messages',
    'branches', 'roles', 'archive_data', 'stations',
    'warehouse_products', 'database_operations', 'sales_logs',
    'admin_logs', 'pre_orders', 'pre_order_items', 'inventory_logs'
];

const fks = [
    { table: 'orders', col: 'customerId', ref: 'customers' },
    { table: 'orders', col: 'batchId', ref: 'batches' },
    { table: 'notifications', col: 'userId', ref: 'users' },
    { table: 'products', col: 'warehouseId', ref: 'warehouse_products' },
    { table: 'products', col: 'categoryId', ref: 'product_categories' },
    { table: 'products', col: 'batchId', ref: 'batches' },
    { table: 'users', col: 'branchId', ref: 'branches' },
    { table: 'users', col: 'roleId', ref: 'roles' },
    { table: 'messages', col: 'senderId', ref: 'users' },
    { table: 'messages', col: 'receiverId', ref: 'users' },
    { table: 'warehouse_products', col: 'batchId', ref: 'batches' },
    { table: 'warehouse_products', col: 'productId', ref: 'products' },
    { table: 'sales_logs', col: 'orderId', ref: 'orders' },
    { table: 'sales_logs', col: 'preOrderId', ref: 'pre_orders' },
    { table: 'pre_orders', col: 'customerId', ref: 'customers' },
    { table: 'pre_orders', col: 'batchId', ref: 'batches' },
    { table: 'pre_orders', col: 'productId', ref: 'products' },
    { table: 'pre_order_items', col: 'preOrderId', ref: 'pre_orders' },
    { table: 'inventory_logs', col: 'productId', ref: 'products' },
    { table: 'inventory_logs', col: 'warehouseProductId', ref: 'warehouse_products' },
    { table: 'inventory_logs', col: 'orderId', ref: 'orders' },
    { table: 'inventory_logs', col: 'preOrderId', ref: 'pre_orders' },
    { table: 'inventory_logs', col: 'userId', ref: 'users' },
    { table: 'inventory_logs', col: 'branchId', ref: 'branches' }
];

let sql = `-- START MIGRATION\n\n`;

// 1. Add new integer ID column to all tables
sql += `-- 1. Add new auto-increment unique integer columns to all tables\n`;
sql += `SET FOREIGN_KEY_CHECKS=0;\n`;
for (const m of models) {
    sql += `ALTER TABLE \`${m}\` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;\n`;
}
sql += `\n`;

// 2. Add new integer foreign key columns
sql += `-- 2. Add new foreign key columns\n`;
for (const fk of fks) {
    sql += `ALTER TABLE \`${fk.table}\` ADD COLUMN new_${fk.col} INT;\n`;
}
sql += `\n`;

// 3. Update new foreign keys using the new_id of the referenced table
sql += `-- 3. Update new foreign keys to map to the new integer IDs\n`;
for (const fk of fks) {
    sql += `UPDATE \`${fk.table}\` child JOIN \`${fk.ref}\` parent ON child.\`${fk.col}\` = parent.id SET child.new_${fk.col} = parent.new_id;\n`;
}
sql += `\n`;

// 4. Drop all existing foreign key constraints
// Wait, we need the exact constraint names. Prisma names them table_col_fkey.
sql += `-- 4. Drop old foreign key constraints\n`;
for (const fk of fks) {
    // Try to drop constraint if it exists. Prisma names it table_col_fkey
    sql += `ALTER TABLE \`${fk.table}\` DROP FOREIGN KEY \`${fk.table}_${fk.col}_fkey\` ; -- Optional: may fail if constraint name is different\n`;
}
sql += `\n`;

// 5. Drop old string columns, rename new integer columns
sql += `-- 5. Drop old columns and rename new columns\n`;
for (const m of models) {
    // Drop PK
    sql += `ALTER TABLE \`${m}\` DROP PRIMARY KEY;\n`;
    sql += `ALTER TABLE \`${m}\` DROP COLUMN id;\n`;
    sql += `ALTER TABLE \`${m}\` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;\n`;
}
sql += `\n`;

for (const fk of fks) {
    sql += `ALTER TABLE \`${fk.table}\` DROP COLUMN \`${fk.col}\`;\n`;
    sql += `ALTER TABLE \`${fk.table}\` CHANGE COLUMN new_${fk.col} \`${fk.col}\` INT;\n`;
}
sql += `\n`;

// 6. Re-add foreign key constraints
sql += `-- 6. Re-add foreign key constraints\n`;
for (const fk of fks) {
    sql += `ALTER TABLE \`${fk.table}\` ADD CONSTRAINT \`${fk.table}_${fk.col}_fkey\` FOREIGN KEY (\`${fk.col}\`) REFERENCES \`${fk.ref}\` (id) ON DELETE SET NULL ON UPDATE CASCADE;\n`;
}
sql += `SET FOREIGN_KEY_CHECKS=1;\n`;


fs.writeFileSync('migration.sql', sql);
console.log('Generated migration.sql');
