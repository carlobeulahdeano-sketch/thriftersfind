-- Migration to add branchId to products table
ALTER TABLE products ADD COLUMN branchId INT NULL;
ALTER TABLE products ADD CONSTRAINT products_branchId_fkey FOREIGN KEY (branchId) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX products_branchId_fkey ON products(branchId);
