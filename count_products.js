const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countProducts() {
  try {
    const count = await prisma.product.count();
    console.log('Total products:', count);
    
    // Check if any products have null createdAt
    const nullCreatedAt = await prisma.product.count({
        where: { createdAt: null }
    });
    console.log('Products with null createdAt:', nullCreatedAt);

  } catch (error) {
    console.error('Error counting products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

countProducts();
