import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Fetch only IDs, sorted
    const idsResult = await prisma.product.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // 2. Fetch full products by those IDs, no ordering
    const products = await prisma.product.findMany({
      where: { id: { in: idsResult.map((p: any) => p.id) } },
      include: {
        category: {
          select: { name: true }
        }
      }
    });

    // 3. Re-sort in memory
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const finalProducts = idsResult.map((p: any) => productMap.get(p.id)!);

    console.log("Success! Found", finalProducts.length, "products. First item:", finalProducts[0]?.id);
  } catch (err: any) {
    console.error("Failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
