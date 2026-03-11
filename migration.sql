-- START MIGRATION

-- 1. Add new auto-increment unique integer columns to all tables
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `customers` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `orders` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `notifications` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `batches` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `product_categories` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `products` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `users` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `messages` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `branches` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `roles` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `archive_data` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `stations` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `warehouse_products` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `database_operations` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `sales_logs` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `admin_logs` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `pre_orders` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `pre_order_items` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;
ALTER TABLE `inventory_logs` ADD COLUMN new_id INT AUTO_INCREMENT UNIQUE;

-- 2. Add new foreign key columns
ALTER TABLE `orders` ADD COLUMN new_customerId INT;
ALTER TABLE `orders` ADD COLUMN new_batchId INT;
ALTER TABLE `notifications` ADD COLUMN new_userId INT;
ALTER TABLE `products` ADD COLUMN new_warehouseId INT;
ALTER TABLE `products` ADD COLUMN new_categoryId INT;
ALTER TABLE `products` ADD COLUMN new_batchId INT;
ALTER TABLE `users` ADD COLUMN new_branchId INT;
ALTER TABLE `users` ADD COLUMN new_roleId INT;
ALTER TABLE `messages` ADD COLUMN new_senderId INT;
ALTER TABLE `messages` ADD COLUMN new_receiverId INT;
ALTER TABLE `warehouse_products` ADD COLUMN new_batchId INT;
ALTER TABLE `warehouse_products` ADD COLUMN new_productId INT;
ALTER TABLE `sales_logs` ADD COLUMN new_orderId INT;
ALTER TABLE `sales_logs` ADD COLUMN new_preOrderId INT;
ALTER TABLE `pre_orders` ADD COLUMN new_customerId INT;
ALTER TABLE `pre_orders` ADD COLUMN new_batchId INT;
ALTER TABLE `pre_orders` ADD COLUMN new_productId INT;
ALTER TABLE `pre_order_items` ADD COLUMN new_preOrderId INT;
ALTER TABLE `inventory_logs` ADD COLUMN new_productId INT;
ALTER TABLE `inventory_logs` ADD COLUMN new_warehouseProductId INT;
ALTER TABLE `inventory_logs` ADD COLUMN new_orderId INT;
ALTER TABLE `inventory_logs` ADD COLUMN new_preOrderId INT;
ALTER TABLE `inventory_logs` ADD COLUMN new_userId INT;
ALTER TABLE `inventory_logs` ADD COLUMN new_branchId INT;

-- 3. Update new foreign keys to map to the new integer IDs
UPDATE `orders` child JOIN `customers` parent ON child.`customerId` = parent.id SET child.new_customerId = parent.new_id;
UPDATE `orders` child JOIN `batches` parent ON child.`batchId` = parent.id SET child.new_batchId = parent.new_id;
UPDATE `notifications` child JOIN `users` parent ON child.`userId` = parent.id SET child.new_userId = parent.new_id;
UPDATE `products` child JOIN `warehouse_products` parent ON child.`warehouseId` = parent.id SET child.new_warehouseId = parent.new_id;
UPDATE `products` child JOIN `product_categories` parent ON child.`categoryId` = parent.id SET child.new_categoryId = parent.new_id;
UPDATE `products` child JOIN `batches` parent ON child.`batchId` = parent.id SET child.new_batchId = parent.new_id;
UPDATE `users` child JOIN `branches` parent ON child.`branchId` = parent.id SET child.new_branchId = parent.new_id;
UPDATE `users` child JOIN `roles` parent ON child.`roleId` = parent.id SET child.new_roleId = parent.new_id;
UPDATE `messages` child JOIN `users` parent ON child.`senderId` = parent.id SET child.new_senderId = parent.new_id;
UPDATE `messages` child JOIN `users` parent ON child.`receiverId` = parent.id SET child.new_receiverId = parent.new_id;
UPDATE `warehouse_products` child JOIN `batches` parent ON child.`batchId` = parent.id SET child.new_batchId = parent.new_id;
UPDATE `warehouse_products` child JOIN `products` parent ON child.`productId` = parent.id SET child.new_productId = parent.new_id;
UPDATE `sales_logs` child JOIN `orders` parent ON child.`orderId` = parent.id SET child.new_orderId = parent.new_id;
UPDATE `sales_logs` child JOIN `pre_orders` parent ON child.`preOrderId` = parent.id SET child.new_preOrderId = parent.new_id;
UPDATE `pre_orders` child JOIN `customers` parent ON child.`customerId` = parent.id SET child.new_customerId = parent.new_id;
UPDATE `pre_orders` child JOIN `batches` parent ON child.`batchId` = parent.id SET child.new_batchId = parent.new_id;
UPDATE `pre_orders` child JOIN `products` parent ON child.`productId` = parent.id SET child.new_productId = parent.new_id;
UPDATE `pre_order_items` child JOIN `pre_orders` parent ON child.`preOrderId` = parent.id SET child.new_preOrderId = parent.new_id;
UPDATE `inventory_logs` child JOIN `products` parent ON child.`productId` = parent.id SET child.new_productId = parent.new_id;
UPDATE `inventory_logs` child JOIN `warehouse_products` parent ON child.`warehouseProductId` = parent.id SET child.new_warehouseProductId = parent.new_id;
UPDATE `inventory_logs` child JOIN `orders` parent ON child.`orderId` = parent.id SET child.new_orderId = parent.new_id;
UPDATE `inventory_logs` child JOIN `pre_orders` parent ON child.`preOrderId` = parent.id SET child.new_preOrderId = parent.new_id;
UPDATE `inventory_logs` child JOIN `users` parent ON child.`userId` = parent.id SET child.new_userId = parent.new_id;
UPDATE `inventory_logs` child JOIN `branches` parent ON child.`branchId` = parent.id SET child.new_branchId = parent.new_id;

-- 4. Drop old foreign key constraints
ALTER TABLE `orders` DROP FOREIGN KEY `orders_customerId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `orders` DROP FOREIGN KEY `orders_batchId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_userId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `products` DROP FOREIGN KEY `products_warehouseId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `products` DROP FOREIGN KEY `products_categoryId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `products` DROP FOREIGN KEY `products_batchId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `users` DROP FOREIGN KEY `users_branchId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `users` DROP FOREIGN KEY `users_roleId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `messages` DROP FOREIGN KEY `messages_senderId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `messages` DROP FOREIGN KEY `messages_receiverId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `warehouse_products` DROP FOREIGN KEY `warehouse_products_batchId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `warehouse_products` DROP FOREIGN KEY `warehouse_products_productId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `sales_logs` DROP FOREIGN KEY `sales_logs_orderId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `sales_logs` DROP FOREIGN KEY `sales_logs_preOrderId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `pre_orders` DROP FOREIGN KEY `pre_orders_customerId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `pre_orders` DROP FOREIGN KEY `pre_orders_batchId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `pre_orders` DROP FOREIGN KEY `pre_orders_productId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `pre_order_items` DROP FOREIGN KEY `pre_order_items_preOrderId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_productId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_warehouseProductId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_orderId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_preOrderId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_userId_fkey` ; -- Optional: may fail if constraint name is different
ALTER TABLE `inventory_logs` DROP FOREIGN KEY `inventory_logs_branchId_fkey` ; -- Optional: may fail if constraint name is different

-- 5. Drop old columns and rename new columns
ALTER TABLE `customers` DROP PRIMARY KEY;
ALTER TABLE `customers` DROP COLUMN id;
ALTER TABLE `customers` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `orders` DROP PRIMARY KEY;
ALTER TABLE `orders` DROP COLUMN id;
ALTER TABLE `orders` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `notifications` DROP PRIMARY KEY;
ALTER TABLE `notifications` DROP COLUMN id;
ALTER TABLE `notifications` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `batches` DROP PRIMARY KEY;
ALTER TABLE `batches` DROP COLUMN id;
ALTER TABLE `batches` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `product_categories` DROP PRIMARY KEY;
ALTER TABLE `product_categories` DROP COLUMN id;
ALTER TABLE `product_categories` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `products` DROP PRIMARY KEY;
ALTER TABLE `products` DROP COLUMN id;
ALTER TABLE `products` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `users` DROP PRIMARY KEY;
ALTER TABLE `users` DROP COLUMN id;
ALTER TABLE `users` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `messages` DROP PRIMARY KEY;
ALTER TABLE `messages` DROP COLUMN id;
ALTER TABLE `messages` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `branches` DROP PRIMARY KEY;
ALTER TABLE `branches` DROP COLUMN id;
ALTER TABLE `branches` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `roles` DROP PRIMARY KEY;
ALTER TABLE `roles` DROP COLUMN id;
ALTER TABLE `roles` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `archive_data` DROP PRIMARY KEY;
ALTER TABLE `archive_data` DROP COLUMN id;
ALTER TABLE `archive_data` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `stations` DROP PRIMARY KEY;
ALTER TABLE `stations` DROP COLUMN id;
ALTER TABLE `stations` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `warehouse_products` DROP PRIMARY KEY;
ALTER TABLE `warehouse_products` DROP COLUMN id;
ALTER TABLE `warehouse_products` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `database_operations` DROP PRIMARY KEY;
ALTER TABLE `database_operations` DROP COLUMN id;
ALTER TABLE `database_operations` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `sales_logs` DROP PRIMARY KEY;
ALTER TABLE `sales_logs` DROP COLUMN id;
ALTER TABLE `sales_logs` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `admin_logs` DROP PRIMARY KEY;
ALTER TABLE `admin_logs` DROP COLUMN id;
ALTER TABLE `admin_logs` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `pre_orders` DROP PRIMARY KEY;
ALTER TABLE `pre_orders` DROP COLUMN id;
ALTER TABLE `pre_orders` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `pre_order_items` DROP PRIMARY KEY;
ALTER TABLE `pre_order_items` DROP COLUMN id;
ALTER TABLE `pre_order_items` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;
ALTER TABLE `inventory_logs` DROP PRIMARY KEY;
ALTER TABLE `inventory_logs` DROP COLUMN id;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_id id INT AUTO_INCREMENT PRIMARY KEY;

ALTER TABLE `orders` DROP COLUMN `customerId`;
ALTER TABLE `orders` CHANGE COLUMN new_customerId `customerId` INT;
ALTER TABLE `orders` DROP COLUMN `batchId`;
ALTER TABLE `orders` CHANGE COLUMN new_batchId `batchId` INT;
ALTER TABLE `notifications` DROP COLUMN `userId`;
ALTER TABLE `notifications` CHANGE COLUMN new_userId `userId` INT;
ALTER TABLE `products` DROP COLUMN `warehouseId`;
ALTER TABLE `products` CHANGE COLUMN new_warehouseId `warehouseId` INT;
ALTER TABLE `products` DROP COLUMN `categoryId`;
ALTER TABLE `products` CHANGE COLUMN new_categoryId `categoryId` INT;
ALTER TABLE `products` DROP COLUMN `batchId`;
ALTER TABLE `products` CHANGE COLUMN new_batchId `batchId` INT;
ALTER TABLE `users` DROP COLUMN `branchId`;
ALTER TABLE `users` CHANGE COLUMN new_branchId `branchId` INT;
ALTER TABLE `users` DROP COLUMN `roleId`;
ALTER TABLE `users` CHANGE COLUMN new_roleId `roleId` INT;
ALTER TABLE `messages` DROP COLUMN `senderId`;
ALTER TABLE `messages` CHANGE COLUMN new_senderId `senderId` INT;
ALTER TABLE `messages` DROP COLUMN `receiverId`;
ALTER TABLE `messages` CHANGE COLUMN new_receiverId `receiverId` INT;
ALTER TABLE `warehouse_products` DROP COLUMN `batchId`;
ALTER TABLE `warehouse_products` CHANGE COLUMN new_batchId `batchId` INT;
ALTER TABLE `warehouse_products` DROP COLUMN `productId`;
ALTER TABLE `warehouse_products` CHANGE COLUMN new_productId `productId` INT;
ALTER TABLE `sales_logs` DROP COLUMN `orderId`;
ALTER TABLE `sales_logs` CHANGE COLUMN new_orderId `orderId` INT;
ALTER TABLE `sales_logs` DROP COLUMN `preOrderId`;
ALTER TABLE `sales_logs` CHANGE COLUMN new_preOrderId `preOrderId` INT;
ALTER TABLE `pre_orders` DROP COLUMN `customerId`;
ALTER TABLE `pre_orders` CHANGE COLUMN new_customerId `customerId` INT;
ALTER TABLE `pre_orders` DROP COLUMN `batchId`;
ALTER TABLE `pre_orders` CHANGE COLUMN new_batchId `batchId` INT;
ALTER TABLE `pre_orders` DROP COLUMN `productId`;
ALTER TABLE `pre_orders` CHANGE COLUMN new_productId `productId` INT;
ALTER TABLE `pre_order_items` DROP COLUMN `preOrderId`;
ALTER TABLE `pre_order_items` CHANGE COLUMN new_preOrderId `preOrderId` INT;
ALTER TABLE `inventory_logs` DROP COLUMN `productId`;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_productId `productId` INT;
ALTER TABLE `inventory_logs` DROP COLUMN `warehouseProductId`;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_warehouseProductId `warehouseProductId` INT;
ALTER TABLE `inventory_logs` DROP COLUMN `orderId`;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_orderId `orderId` INT;
ALTER TABLE `inventory_logs` DROP COLUMN `preOrderId`;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_preOrderId `preOrderId` INT;
ALTER TABLE `inventory_logs` DROP COLUMN `userId`;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_userId `userId` INT;
ALTER TABLE `inventory_logs` DROP COLUMN `branchId`;
ALTER TABLE `inventory_logs` CHANGE COLUMN new_branchId `branchId` INT;

-- 6. Re-add foreign key constraints
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `orders` ADD CONSTRAINT `orders_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse_products` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `products` ADD CONSTRAINT `products_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `warehouse_products` ADD CONSTRAINT `warehouse_products_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `warehouse_products` ADD CONSTRAINT `warehouse_products_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `sales_logs` ADD CONSTRAINT `sales_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `sales_logs` ADD CONSTRAINT `sales_logs_preOrderId_fkey` FOREIGN KEY (`preOrderId`) REFERENCES `pre_orders` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pre_orders` ADD CONSTRAINT `pre_orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pre_orders` ADD CONSTRAINT `pre_orders_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pre_orders` ADD CONSTRAINT `pre_orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `pre_order_items` ADD CONSTRAINT `pre_order_items_preOrderId_fkey` FOREIGN KEY (`preOrderId`) REFERENCES `pre_orders` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_warehouseProductId_fkey` FOREIGN KEY (`warehouseProductId`) REFERENCES `warehouse_products` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_preOrderId_fkey` FOREIGN KEY (`preOrderId`) REFERENCES `pre_orders` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (id) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches` (id) ON DELETE SET NULL ON UPDATE CASCADE;
SET FOREIGN_KEY_CHECKS=1;
