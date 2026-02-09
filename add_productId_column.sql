-- Add productId column to warehouse_products table
-- This creates a relationship between warehouse_products and products tables

ALTER TABLE `warehouse_products` 
ADD COLUMN `productId` VARCHAR(191) NULL AFTER `alertStock`,
ADD INDEX `warehouse_products_productId_fkey` (`productId`);
