const fs = require('fs');

function showLine(file, lineStr) {
  const lineNum = parseInt(lineStr, 10) - 1;
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8').split('\n');
  console.log(`[${file}:${lineNum+1}] ${content[lineNum]?.trim()}`);
}

showLine('./src/app/(app)/inventory/components/inventory-table.tsx', '176');
showLine('./src/app/(app)/orders/components/create-order-dialog.tsx', '613');
showLine('./src/app/(app)/orders/components/create-order-dialog.tsx', '621');
showLine('./src/app/(app)/orders/components/create-order-dialog.tsx', '725');
showLine('./src/app/(app)/orders/components/create-order-dialog.tsx', '758');
showLine('./src/app/(app)/orders/components/edit-order-dialog.tsx', '477');
showLine('./src/app/(app)/orders/components/edit-order-dialog.tsx', '486');
showLine('./src/app/(app)/orders/components/edit-order-dialog.tsx', '559');
showLine('./src/app/(app)/orders/components/edit-order-dialog.tsx', '623');
showLine('./src/app/(app)/orders/components/order-table.tsx', '199');
showLine('./src/app/(app)/orders/components/order-table.tsx', '202');
showLine('./src/app/(app)/orders/components/order-table.tsx', '247');
showLine('./src/app/(app)/orders/components/order-table.tsx', '473');
showLine('./src/app/(app)/pre-orders/components/pay-balance-dialog.tsx', '42');

