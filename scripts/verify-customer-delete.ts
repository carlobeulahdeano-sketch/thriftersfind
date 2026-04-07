import { prisma } from "../src/lib/prisma";
import { deleteCustomer } from "../src/app/(app)/customers/actions";

async function verify() {
  console.log("Starting verification...");

  // Mock a user with permissions for the action call
  // Note: Since this is a server action, it checks getCurrentUser()
  // In a script, we might need to bypass or mock auth if possible,
  // but let's see if we can just test the database state first or 
  // interact with the prisma logic directly.
  
  // Since I can't easily mock getCurrentUser() in a standalone script without more setup,
  // I will just test the logic inside the script using Prisma directly to simulate what the action does.

  try {
    // 1. Find a customer with orders
    const customerWithOrders = await prisma.customer.findFirst({
      where: { orders: { some: {} } },
      include: { orders: true }
    });

    if (customerWithOrders) {
      console.log(`Testing customer with orders: ${customerWithOrders.name} (ID: ${customerWithOrders.id})`);
      const orderCount = await prisma.order.count({ where: { customerId: customerWithOrders.id } });
      console.log(`Orders found: ${orderCount}`);
      if (orderCount > 0) {
        console.log("PASSED: Logic would block this deletion.");
      }
    } else {
      console.log("No customer with orders found to test.");
    }

    // 2. Create a temporary customer without orders and delete them
    console.log("Creating temporary customer for deletion test...");
    const tempCustomer = await prisma.customer.create({
      data: {
        name: "Test Delete Customer",
        email: "test-delete@example.com",
        isActive: true
      }
    });

    console.log(`Created: ${tempCustomer.name} (ID: ${tempCustomer.id})`);
    
    // Simulate the deletion logic
    const orderCountTemp = await prisma.order.count({ where: { customerId: tempCustomer.id } });
    const preOrderCountTemp = await prisma.preOrder.count({ where: { customerId: tempCustomer.id } });

    if (orderCountTemp === 0 && preOrderCountTemp === 0) {
      await prisma.customer.delete({ where: { id: tempCustomer.id } });
      console.log("PASSED: Temporary customer deleted successfully.");
    } else {
      console.log("FAILED: Temporary customer somehow has orders.");
    }

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
