-- Create product_categories table
CREATE TABLE IF NOT EXISTS `product_categories` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `product_categories_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add categoryId column to products table
ALTER TABLE `products` ADD COLUMN `categoryId` VARCHAR(191) NULL;

-- Add index for categoryId
CREATE INDEX `products_categoryId_fkey` ON `products`(`categoryId`);
