const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/handleDelete\((batch|station|product)\.id/g, 'handleDelete(String($1.id)');
    content = content.replace(/recordPreOrderPayment\(preOrder\.id/g, 'recordPreOrderPayment(String(preOrder.id)');
    content = content.replace(/updateOrder\(order\.id/g, 'updateOrder(String(order.id)');
    content = content.replace(/updateStation\(station\.id/g, 'updateStation(String(station.id)');
    content = content.replace(/updateUser\(user\.id/g, 'updateUser(String(user.id)');
    content = content.replace(/deleteUser\(userToDelete\.id\)/g, 'deleteUser(String(userToDelete.id))');
    content = content.replace(/toggleUserStatus\(user\.id/g, 'toggleUserStatus(String(user.id)');
    content = content.replace(/updateWarehouseProduct\(product\.id/g, 'updateWarehouseProduct(String(product.id)');
    content = content.replace(/transferToInventory\(product\.id/g, 'transferToInventory(String(product.id)');
    content = content.replace(/adjustWarehouseStock\(product\.id/g, 'adjustWarehouseStock(String(product.id)');
    content = content.replace(/getMessages\(user\.id\)/g, 'getMessages(String(user.id))');
    content = content.replace(/markMessagesAsRead\(user\.id\)/g, 'markMessagesAsRead(String(user.id))');
    content = content.replace(/sendMessage\(user\.id/g, 'sendMessage(String(user.id)');
    content = content.replace(/setPrintingOrderId\(order\.id\)/g, 'setPrintingOrderId(String(order.id))');
    content = content.replace(/setRoleId\(user\.roleId \|\| ""\)/g, 'setRoleId(user.roleId ? String(user.roleId) : "")');
    content = content.replace(/setBranchId\(user\.branchId \|\| ""\)/g, 'setBranchId(user.branchId ? String(user.branchId) : "")');
    content = content.replace(/value=\{branch\.id\}/g, 'value={String(branch.id)}');
    content = content.replace(/value=\{role\.id\}/g, 'value={String(role.id)}');
    content = content.replace(/entry\.batchIds\.add\(order\.batchId\)/g, 'entry.batchIds.add(String(order.batchId))');
    content = content.replace(/handleQuantityChange\(product\.id/g, 'handleQuantityChange(String(product.id)');
    content = content.replace(/toggleSelection\(product\.id\)/g, 'toggleSelection(String(product.id))');
    content = content.replace(/selectedProductIds\.has\(product\.id\)/g, 'selectedProductIds.has(String(product.id))');
    content = content.replace(/selectedProductIds\.has\(p\.id\)/g, 'selectedProductIds.has(String(p.id))');
    
    // For bulk add stock
    content = content.replace(/bulkAddWarehouseStock\(itemsToUpdate\)/g, 'bulkAddWarehouseStock(itemsToUpdate.map(i => ({...i, id: String(i.id)})))');
    
    // orders/actions.ts String returns
    if (filePath.replace(/\\/g, '/').includes('/orders/actions.ts')) {
       // Wait, replacing arbitrary strings might be dangerous. Let's not touch actions.ts blindly.
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed ' + filePath);
    }
  }
});
