const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  let orig = text;

  // fix states
  text = text.replace(/useState<string \| null>/g, 'useState<string | number | null>');
  text = text.replace(/useState<string>/g, 'useState<string | number>');
  
  // fix slice and substring
  text = text.replace(/([a-zA-Z0-9_\.]+)\.id\.slice\(/g, 'String($1.id).slice(');
  text = text.replace(/([a-zA-Z0-9_\.]+)\.id\.substring\(/g, 'String($1.id).substring(');

  // setOrderId, etc.
  text = text.replace(/setOrderId\(([a-zA-Z0-9_\.]+)\.id\)/g, 'setOrderId(String($1.id))');
  text = text.replace(/setPrintingOrderId\(([a-zA-Z0-9_\.]+)\.id\)/g, 'setPrintingOrderId(String($1.id))');

  // getMessages, etc.
  text = text.replace(/getMessages\(([a-zA-Z0-9_\.]+)\.id\)/g, 'getMessages(String($1.id))');
  
  // itemsToUpdate cast
  text = text.replace(/bulkAddWarehouseStock\(itemsToUpdate\)/g, 'bulkAddWarehouseStock(itemsToUpdate.map(i => ({...i, id: String(i.id)})))');
  
  // pay-balance
  text = text.replace(/recordPreOrderPayment\(preOrder\.id/g, 'recordPreOrderPayment(String(preOrder.id)');
  
  // toggleCustomerStatus
  text = text.replace(/handleToggleStatus\(customer\.id/g, 'handleToggleStatus(String(customer.id)');
  
  // select-products-dialog
  text = text.replace(/selectedProductIds\.has\(p\.id\)/g, 'selectedProductIds.has(String(p.id))');
  text = text.replace(/selectedProductIds\.has\(product\.id\)/g, 'selectedProductIds.has(String(product.id))');
  text = text.replace(/toggleSelection\(product\.id\)/g, 'toggleSelection(String(product.id))');
  
  if (text !== orig) {
    fs.writeFileSync(file, text);
    console.log("Fixed " + file);
  }
}

const files = [
  './src/app/(app)/customers/components/customer-table.tsx',
  './src/app/(app)/dashboard/components/view-held-orders-dialog.tsx',
  './src/app/(app)/orders/components/edit-order-dialog.tsx',
  './src/app/(app)/orders/components/order-table.tsx',
  './src/app/(app)/pre-orders/components/pay-balance-dialog.tsx',
  './src/app/(app)/pre-orders/components/select-products-dialog.tsx',
  './src/app/(app)/sales/components/recent-sales-table.tsx'
];

files.forEach(fixFile);

// Also fix some actions that might be returning number instead of string
function fixAction(file) {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  let orig = text;
  
  // Quick fix for ID returns where expected string
  text = text.replace(/id: product\.id,/g, 'id: String(product.id),');
  text = text.replace(/id: order\.id,/g, 'id: String(order.id),');
  text = text.replace(/id: user\.id,/g, 'id: String(user.id),');
  text = text.replace(/id: station\.id,/g, 'id: String(station.id),');
  text = text.replace(/id: batch\.id,/g, 'id: String(batch.id),');

  if (text !== orig) {
    fs.writeFileSync(file, text);
    console.log("Fixed Action " + file);
  }
}

fixAction('./src/app/(app)/inventory/actions.ts');
fixAction('./src/app/(app)/orders/actions.ts');
fixAction('./src/app/(app)/admin/inventory-logs/page.tsx');

