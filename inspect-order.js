
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const preOrders = await prisma.preOrder.findMany({
        where: { customerName: { contains: 'xian' } },
        include: { items: true }
    });
    console.log(JSON.stringify(preOrders, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
