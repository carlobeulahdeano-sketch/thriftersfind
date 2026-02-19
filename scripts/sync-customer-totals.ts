import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log("Checking database connection...")
        await prisma.$connect()
        console.log("Connected successfully.")

        console.log("Fetching all customers with their delivered orders...")
        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    where: {
                        shippingStatus: 'Delivered'
                    }
                }
            }
        });

        console.log(`Found ${customers.length} customers. Starting sync...`);

        for (const customer of customers) {
            const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalAmount, 0);

            console.log(`Customer: ${customer.name} (${customer.email}) - Calculated Total: ₱${totalSpent.toFixed(2)}`);

            await prisma.customer.update({
                where: { id: customer.id },
                data: { totalSpent }
            });
        }

        console.log("Synchronization complete!");

    } catch (e) {
        console.error("Synchronization failed:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
