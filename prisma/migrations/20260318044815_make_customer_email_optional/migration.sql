-- CreateTable
CREATE TABLE `customers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `street` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `zip` VARCHAR(191) NULL,
    `orderHistory` JSON NULL,
    `totalSpent` DOUBLE NULL DEFAULT 0,
    `role` VARCHAR(191) NULL,
    `createdBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `customers_email_key`(`email`),
    INDEX `customers_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerName` VARCHAR(191) NOT NULL,
    `contactNumber` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `orderDate` DATETIME(3) NULL,
    `itemName` VARCHAR(191) NOT NULL,
    `items` JSON NULL,
    `quantity` INTEGER NOT NULL,
    `price` DOUBLE NOT NULL,
    `shippingFee` DOUBLE NOT NULL,
    `totalAmount` DOUBLE NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `paymentStatus` VARCHAR(191) NULL,
    `shippingStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerEmail` VARCHAR(191) NULL,
    `courierName` VARCHAR(191) NULL,
    `trackingNumber` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `rushShip` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` JSON NULL,
    `customerId` INTEGER NOT NULL,
    `batchId` INTEGER NULL,

    INDEX `orders_batchId_fkey`(`batchId`),
    INDEX `orders_customerId_fkey`(`customerId`),
    INDEX `orders_createdAt_idx`(`createdAt`),
    INDEX `orders_orderDate_idx`(`orderDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `userId` INTEGER NULL,

    INDEX `notifications_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `batches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batchName` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `totalOrders` INTEGER NULL,
    `totalSales` DOUBLE NULL,
    `createdBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `manufactureDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `batches_createdAt_idx`(`createdAt`),
    INDEX `batches_manufactureDate_idx`(`manufactureDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `imageUrl` LONGTEXT NULL,

    UNIQUE INDEX `product_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `alertStock` INTEGER NOT NULL DEFAULT 0,
    `cost` DOUBLE NOT NULL,
    `retailPrice` DOUBLE NULL,
    `images` JSON NULL,
    `createdBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `branchId` INTEGER NULL,
    `batchId` INTEGER NULL,
    `categoryId` INTEGER NULL,
    `warehouseId` INTEGER NULL,

    INDEX `products_warehouseId_fkey`(`warehouseId`),
    INDEX `products_batchId_fkey`(`batchId`),
    INDEX `products_categoryId_fkey`(`categoryId`),
    INDEX `products_branchId_fkey`(`branchId`),
    INDEX `products_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `permissions` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `branchId` INTEGER NULL,
    `roleId` INTEGER NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_branchId_fkey`(`branchId`),
    INDEX `users_roleId_fkey`(`roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `content` LONGTEXT NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,

    INDEX `messages_senderId_idx`(`senderId`),
    INDEX `messages_receiverId_idx`(`receiverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `branches` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `branches_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `archive_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableName` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `contactNumber` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse_products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productName` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `manufacture_date` DATETIME(3) NULL,
    `image` LONGTEXT NULL,
    `location` VARCHAR(191) NULL,
    `cost` DOUBLE NOT NULL,
    `retailPrice` DOUBLE NULL,
    `images` JSON NULL,
    `createdBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `alertStock` INTEGER NOT NULL DEFAULT 0,
    `batchId` INTEGER NULL,
    `productId` INTEGER NULL,
    `categoryId` INTEGER NULL,

    INDEX `warehouse_products_batchId_fkey`(`batchId`),
    INDEX `warehouse_products_productId_fkey`(`productId`),
    INDEX `warehouse_products_categoryId_fkey`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `database_operations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileSize` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `products` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `orders` JSON NULL,
    `customerName` VARCHAR(191) NULL,
    `totalAmount` DOUBLE NULL,
    `shipments` JSON NULL,
    `order_items` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `orderId` INTEGER NULL,
    `preOrderId` INTEGER NULL,

    INDEX `sales_logs_orderId_idx`(`orderId`),
    INDEX `sales_logs_preOrderId_idx`(`preOrderId`),
    INDEX `sales_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `performedBy` JSON NULL,
    `targetId` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NULL,
    `previousData` JSON NULL,
    `newData` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_logs_action_idx`(`action`),
    INDEX `admin_logs_module_idx`(`module`),
    INDEX `admin_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pre_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerName` VARCHAR(191) NOT NULL,
    `contactNumber` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `orderDate` DATETIME(3) NULL,
    `totalAmount` DOUBLE NOT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `paymentStatus` VARCHAR(191) NULL DEFAULT 'Unpaid',
    `depositAmount` DOUBLE NULL DEFAULT 0,
    `customerEmail` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `createdBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `customerId` INTEGER NOT NULL,
    `batchId` INTEGER NULL,
    `productId` INTEGER NULL,

    INDEX `pre_orders_customerId_fkey`(`customerId`),
    INDEX `pre_orders_batchId_fkey`(`batchId`),
    INDEX `pre_orders_productId_fkey`(`productId`),
    INDEX `pre_orders_createdAt_idx`(`createdAt`),
    INDEX `pre_orders_orderDate_idx`(`orderDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pre_order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productName` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `pricePerUnit` DOUBLE NOT NULL,
    `totalPrice` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `images` JSON NULL,
    `preOrderId` INTEGER NOT NULL,

    INDEX `pre_order_items_preOrderId_fkey`(`preOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventory_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `quantityChange` INTEGER NOT NULL,
    `previousStock` INTEGER NOT NULL,
    `newStock` INTEGER NOT NULL,
    `reason` VARCHAR(191) NULL,
    `referenceId` VARCHAR(191) NULL,
    `performedBy` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `productId` INTEGER NULL,
    `warehouseProductId` INTEGER NULL,
    `orderId` INTEGER NULL,
    `preOrderId` INTEGER NULL,
    `userId` INTEGER NULL,
    `branchId` INTEGER NULL,

    INDEX `inventory_logs_productId_idx`(`productId`),
    INDEX `inventory_logs_warehouseProductId_idx`(`warehouseProductId`),
    INDEX `inventory_logs_orderId_idx`(`orderId`),
    INDEX `inventory_logs_preOrderId_idx`(`preOrderId`),
    INDEX `inventory_logs_userId_idx`(`userId`),
    INDEX `inventory_logs_branchId_idx`(`branchId`),
    INDEX `inventory_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse_products` ADD CONSTRAINT `warehouse_products_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse_products` ADD CONSTRAINT `warehouse_products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `product_categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_logs` ADD CONSTRAINT `sales_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales_logs` ADD CONSTRAINT `sales_logs_preOrderId_fkey` FOREIGN KEY (`preOrderId`) REFERENCES `pre_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_orders` ADD CONSTRAINT `pre_orders_batchId_fkey` FOREIGN KEY (`batchId`) REFERENCES `batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_orders` ADD CONSTRAINT `pre_orders_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_orders` ADD CONSTRAINT `pre_orders_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pre_order_items` ADD CONSTRAINT `pre_order_items_preOrderId_fkey` FOREIGN KEY (`preOrderId`) REFERENCES `pre_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `branches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_preOrderId_fkey` FOREIGN KEY (`preOrderId`) REFERENCES `pre_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventory_logs` ADD CONSTRAINT `inventory_logs_warehouseProductId_fkey` FOREIGN KEY (`warehouseProductId`) REFERENCES `warehouse_products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
