const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const branches = await prisma.branch.findMany();
    console.log('Branches:', JSON.stringify(branches, null, 2));

    const productCount = await prisma.product.count();
    console.log('Total Products:', productCount);

    const productsWithoutBranch = await prisma.product.count({
      where: {
        branchId: null
      }
    });
    console.log('Products without branchId:', productsWithoutBranch);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
