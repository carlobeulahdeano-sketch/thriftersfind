const fs = require('fs');

function fixOrdersActions() {
    const file = './src/app/(app)/orders/actions.ts';
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, 'utf8');
    let orig = text;
    
    text = text.replace(/id: order\.id,/g, 'id: String(order.id),');
    text = text.replace(/logInventoryMovement\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), order\.id,/g, 'logInventoryMovement($1, $2, $3, $4, $5, String(order.id),');
    text = text.replace(/where: \{ id: targetBatchId \}/g, 'where: { id: Number(targetBatchId) }');
    text = text.replace(/where: \{ id: order\.customerId \}/g, 'where: { id: Number(order.customerId) }');
    text = text.replace(/where: \{ id: orderId \}/g, 'where: { id: Number(orderId) }');
    text = text.replace(/data: \{\s*shippingStatus/g, 'data: { shippingStatus');
    
    // isValidBatchId signature
    text = text.replace(/const isValidBatchId = \(bid: string \| null \| undefined\)/g, 'const isValidBatchId = (bid: string | number | null | undefined)');
    
    // batchId update
    text = text.replace(/batchId: orderData\.batchId,/g, 'batchId: orderData.batchId ? Number(orderData.batchId) : undefined,');
    text = text.replace(/customerId: orderData\.customerId,/g, 'customerId: orderData.customerId ? Number(orderData.customerId) : undefined,');

    if (text !== orig) {
        fs.writeFileSync(file, text);
        console.log("Fixed orders/actions.ts");
    }
}

function fixNotificationsActions() {
    const file = './src/app/(app)/inventory/notifications-actions.ts';
    if (!fs.existsSync(file)) return;
    let text = fs.readFileSync(file, 'utf8');
    let orig = text;
    
    text = text.replace(/where: \{ id \}/g, 'where: { id: Number(id) }');
    text = text.replace(/deleteNotification\((id|notificationId): string\)/g, 'deleteNotification($1: string | number)');
    text = text.replace(/markNotificationAsRead\((id|notificationId): string\)/g, 'markNotificationAsRead($1: string | number)');

    if (text !== orig) {
        fs.writeFileSync(file, text);
        console.log("Fixed inventory/notifications-actions.ts");
    }
}

function fixInventoryComponents() {
    const files = [
        './src/app/(app)/inventory/components/add-product-dialog.tsx',
        './src/app/(app)/inventory/components/add-quantity-dialog.tsx',
        './src/app/(app)/inventory/components/bulk-add-stock-dialog.tsx',
        './src/app/(app)/inventory/components/deduct-quantity-dialog.tsx',
        './src/app/(app)/inventory/components/edit-product-dialog.tsx',
        './src/app/(app)/inventory/components/inventory-table.tsx'
    ];
    
    files.forEach(file => {
        if (!fs.existsSync(file)) return;
        let text = fs.readFileSync(file, 'utf8');
        let orig = text;
        
        text = text.replace(/value=\{cat\.id\}/g, 'value={String(cat.id)}');
        text = text.replace(/value=\{warehouse\.id\}/g, 'value={String(warehouse.id)}');
        text = text.replace(/setCategoryId\([^\)]+\)/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\)/, '(String($1))');
        });
        text = text.replace(/bulkAddWarehouseStock\(itemsToUpdate/g, 'bulkAddWarehouseStock(itemsToUpdate.map(i => ({...i, productId: String(i.productId)}))');
        text = text.replace(/adjustWarehouseStock\([^\,]+,/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\,/, '(String($1),');
        });
        text = text.replace(/updateProduct\([^\,]+,/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\,/, '(String($1),');
        });
        text = text.replace(/handleDelete\([^\)]+\)/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\)/, '(String($1))');
        });

        if (text !== orig) {
            fs.writeFileSync(file, text);
            console.log("Fixed " + file);
        }
    });
}

function fixOrderComponents() {
    const files = [
        './src/app/(app)/orders/components/create-order-dialog.tsx',
        './src/app/(app)/orders/components/edit-order-dialog.tsx',
        './src/app/(app)/orders/components/order-table.tsx',
        './src/app/(app)/pre-orders/components/pay-balance-dialog.tsx',
        './src/app/(app)/customers/components/edit-customer-dialog.tsx'
    ];
    
    files.forEach(file => {
        if (!fs.existsSync(file)) return;
        let text = fs.readFileSync(file, 'utf8');
        let orig = text;
        
        text = text.replace(/value=\{batch\.id\}/g, 'value={String(batch.id)}');
        text = text.replace(/value=\{customer\.id\}/g, 'value={String(customer.id)}');
        text = text.replace(/setBatchId\([^\)]+\)/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\)/, '(String($1))');
        });
        text = text.replace(/setCustomerId\([^\)]+\)/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\)/, '(String($1))');
        });
        text = text.replace(/recordPreOrderPayment\([^\,]+,/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\,/, '(String($1),');
        });
        text = text.replace(/updateCustomer\([^\,]+,/g, match => {
            if (match.includes('String(')) return match;
            return match.replace(/\((.+)\,/, '(String($1),');
        });

        // specific for order-table
        text = text.replace(/order\.id\.toLowerCase\(\)/g, 'String(order.id).toLowerCase()');
        text = text.replace(/order\.id\.substring\(/g, 'String(order.id).substring(');

        if (text !== orig) {
            fs.writeFileSync(file, text);
            console.log("Fixed " + file);
        }
    });
}

fixOrdersActions();
fixNotificationsActions();
fixInventoryComponents();
fixOrderComponents();

