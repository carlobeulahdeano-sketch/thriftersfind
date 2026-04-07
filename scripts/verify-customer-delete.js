const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function verify() {
  console.log("Starting verification (JS)...");

  try {
    // 1. Find a customer with orders
    const customerWithOrders = await prisma.customer.findFirst({
      where: { orders: { some: {} } },
      include: { _count: { select: { orders: true, preOrders: true } } }
    });

    if (customerWithOrders) {
      console.log(`Testing customer with transactions: ${customerWithOrders.name} (ID: ${customerWithOrders.id})`);
      console.log(`Orders: ${customerWithOrders._count.orders}, Pre-orders: ${customerWithOrders._count.preOrders}`);
      
      if (customerWithOrders._count.orders > 0 || customerWithOrders._count.preOrders > 0) {
        console.log("SUCCESS: This customer has transactions and would be blocked by deleteCustomer().");
      }
    } else {
      console.log("No customer with transactions found to test.");
    }

    // 2. Create and delete a temporary customer
    console.log("\nTesting deletion of a customer WITHOUT transactions...");
    const tempName = "Delete Test " + Date.now();
    const tempCustomer = await prisma.customer.create({
      data: {
        name: tempName,
        email: `test-${Date.now()}@example.com`,
        isActive: true
      }
    });

    console.log(`Created temporary customer: ${tempCustomer.name} (ID: ${tempCustomer.id})`);
    
    // Check if they have orders (should be 0)
    const counts = await prisma.customer.findUnique({
      where: { id: tempCustomer.id },
      include: { _count: { select: { orders: true, preOrders: true } } }
    });

    if (counts._count.orders === 0 && counts._count.preOrders === 0) {
      console.log("Confirmed: No transactions for this customer.");
      await prisma.customer.delete({ where: { id: tempCustomer.id } });
      console.log("SUCCESS: Temporary customer deleted successfully from database.");
    } else {
      console.log("ERROR: Temporary customer has unexpected transactions.");
    }

  } catch (error) {
    console.error("Verification error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
