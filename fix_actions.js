const fs = require('fs');

function replaceParam(file, regex, replacement) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(regex, replacement);
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log('Updated ' + file);
    }
  }
}

replaceParam('./src/app/(app)/batches/actions.ts', /updateBatch\((id|batchId): string,/g, 'updateBatch($1: string | number,');
replaceParam('./src/app/(app)/batches/actions.ts', /deleteBatch\((id|batchId): string\)/g, 'deleteBatch($1: string | number)');

replaceParam('./src/app/(app)/customers/actions.ts', /updateCustomer\((customerId|id): string,/g, 'updateCustomer($1: string | number,');
replaceParam('./src/app/(app)/customers/actions.ts', /toggleCustomerStatus\((customerId|id): string,/g, 'toggleCustomerStatus($1: string | number,');

replaceParam('./src/app/(app)/stations/actions.ts', /updateStation\((id|stationId): string,/g, 'updateStation($1: string | number,');
replaceParam('./src/app/(app)/stations/actions.ts', /deleteStation\((id|stationId): string\)/g, 'deleteStation($1: string | number)');

replaceParam('./src/app/(app)/users/actions.ts', /updateUser\((userId|id): string,/g, 'updateUser($1: string | number,');
replaceParam('./src/app/(app)/users/actions.ts', /deleteUser\((userId|id): string\)/g, 'deleteUser($1: string | number)');
replaceParam('./src/app/(app)/users/actions.ts', /toggleUserStatus\((userId|id): string,/g, 'toggleUserStatus($1: string | number,');

replaceParam('./src/app/(app)/warehouses/actions.ts', /updateWarehouseProduct\((id|productId): string,/g, 'updateWarehouseProduct($1: string | number,');
replaceParam('./src/app/(app)/warehouses/actions.ts', /transferToInventory\((id|productId): string,/g, 'transferToInventory($1: string | number,');
replaceParam('./src/app/(app)/warehouses/actions.ts', /adjustWarehouseStock\((id|productId): string,/g, 'adjustWarehouseStock($1: string | number,');
replaceParam('./src/app/(app)/warehouses/actions.ts', /deleteWarehouseProduct\((id|productId): string\)/g, 'deleteWarehouseProduct($1: string | number)');

replaceParam('./src/app/(app)/warehouses/[id]/actions.ts', /updateWarehouseProduct\((id|productId): string,/g, 'updateWarehouseProduct($1: string | number,');
replaceParam('./src/app/(app)/warehouses/[id]/actions.ts', /transferToInventory\((id|productId): string,/g, 'transferToInventory($1: string | number,');
replaceParam('./src/app/(app)/warehouses/[id]/actions.ts', /adjustWarehouseStock\((id|productId): string,/g, 'adjustWarehouseStock($1: string | number,');
replaceParam('./src/app/(app)/warehouses/[id]/actions.ts', /deleteWarehouseProduct\((id|productId): string\)/g, 'deleteWarehouseProduct($1: string | number)');

replaceParam('./src/components/chat/chat-actions.ts', /getMessages\((userId|id): string\)/g, 'getMessages($1: string | number)');
replaceParam('./src/components/chat/chat-actions.ts', /markMessagesAsRead\((userId|id): string\)/g, 'markMessagesAsRead($1: string | number)');
replaceParam('./src/components/chat/chat-actions.ts', /sendMessage\((receiverId|id): string,/g, 'sendMessage($1: string | number,');

replaceParam('./src/app/(app)/bodega/inventory/actions.ts', /updateBodegaProduct\((id|productId): string,/g, 'updateBodegaProduct($1: string | number,');

replaceParam('./src/app/(app)/orders/actions.ts', /updateOrder\((id|orderId): string,/g, 'updateOrder($1: string | number,');

replaceParam('./src/app/(app)/inventory/category-actions.ts', /deleteCategory\((id|categoryId): string\)/g, 'deleteCategory($1: string | number)');
replaceParam('./src/app/(app)/inventory/category-actions.ts', /updateCategory\((id|categoryId): string,/g, 'updateCategory($1: string | number,');
