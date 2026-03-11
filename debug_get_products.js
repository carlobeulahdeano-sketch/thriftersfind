const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock getCurrentUser
async function getCurrentUser() {
    // Try to get a real user from DB
    const user = await prisma.user.findFirst({
        include: { role_rel: true }
    });
    return user;
}

async function getProducts() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log("No user found");
      return [];
    }

    const roleName = user.role_rel?.name?.toLowerCase() || (typeof user.role === 'string' ? user.role.toLowerCase() : "");
    const isSuperAdmin = roleName === "super admin";

    const whereClause = {};
    if (!isSuperAdmin && user.branchId) {
      whereClause.branchId = user.branchId;
    }

    console.log("Fetching ordered IDs with where:", whereClause);
    const orderedIds = await prisma.product.findMany({
      where: whereClause,
      select: { id: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Found", orderedIds.length, "ordered IDs");

    const finalWhereClause = { id: { in: orderedIds.map(p => p.id) } };
    
    console.log("Fetching unsorted products...");
    const unsortedProducts = await prisma.product.findMany({
      where: finalWhereClause,
      include: {
        category: {
          select: { name: true }
        }
      }
    });
    console.log("Found", unsortedProducts.length, "unsorted products");

    const productMap = new Map(unsortedProducts.map(p => [p.id, p]));
    const products = orderedIds.map(p => productMap.get(p.id)).filter(Boolean);

    console.log("Mapping products...");
    const result = products.map(product => {
      let images = [];
      try {
        if (Array.isArray(product.images)) {
          images = product.images;
        } else if (typeof product.images === 'string') {
          const parsed = JSON.parse(product.images);
          if (Array.isArray(parsed)) images = parsed;
        }
      } catch (e) {
        // ignore
      }

      const categoryName = product.category?.name;

      return {
        id: String(product.id),
        name: product.name,
        sku: product.sku,
        description: product.description || "",
        category: categoryName ? { name: categoryName } : null,
      };
    });
    console.log("Success! Mapped", result.length, "products");
    return result;

  } catch (error) {
    console.error("CRITICAL ERROR IN getProducts:", error);
    throw error;
  }
}

getProducts().then(() => prisma.$disconnect()).catch(err => {
    console.error(err);
    prisma.$disconnect();
});
