const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const mainBranch = await prisma.branch.findUnique({
      where: { name: 'main branch' }
    });

    if (!mainBranch) {
      console.error('Error: "main branch" not found.');
      return;
    }

    console.log(`Found main branch: ${mainBranch.name} (ID: ${mainBranch.id})`);

    const result = await prisma.product.updateMany({
      where: {
        branchId: null
      },
      data: {
        branchId: mainBranch.id
      }
    });

    console.log(`Successfully updated ${result.count} products.`);

  } catch (error) {
    console.error('Error updating products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
