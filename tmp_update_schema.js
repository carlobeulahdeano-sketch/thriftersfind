const fs = require('fs');

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace standard id fields
schema = schema.replace(/id\s+String\s+@id\s+@default\(cuid\(\)\)/g, 'id Int @id @default(autoincrement())');

// Replace foreign key fields
const fks = [
    'customerId', 'batchId', 'userId', 'warehouseId', 'categoryId',
    'roleId', 'branchId', 'senderId', 'receiverId', 'productId',
    'orderId', 'preOrderId', 'warehouseProductId'
];

fks.forEach(fk => {
    // We need to match lines like `customerId String` or `customerId String?`
    // Make sure not to match other things incidentally.
    const regex = new RegExp(`(\\b${fk}\\b\\s+)String(\\??)`, 'g');
    schema = schema.replace(regex, '$1Int$2');
});

fs.writeFileSync(schemaPath, schema);
console.log('schema.prisma updated successfully.');
