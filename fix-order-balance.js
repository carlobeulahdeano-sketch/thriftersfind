
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const preOrders = await prisma.preOrder.findMany({
        where: { customerName: { contains: 'xian' } }
    });

    if (preOrders.length === 0) {
        console.log('No orders found for xian');
        return;
    }

    for (const order of preOrders) {
        console.log(`Found order: ID=${order.id}, Customer=${order.customerName}, Total=${order.totalAmount}, Paid=${order.depositAmount}`);
        if (order.totalAmount === 400 && order.depositAmount === 401) {
            const updated = await prisma.preOrder.update({
                where: { id: order.id },
                data: { depositAmount: 400 }
            });
            console.log(`  --- UPDATED depositAmount to 400 for order ${order.id}`);
        }
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
