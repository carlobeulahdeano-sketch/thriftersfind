import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: { role_rel: true }
    });
    console.log("Users:", users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role_rel?.name })));

    const preOrders = await prisma.preOrder.findMany();
    console.log("PreOrders count:", preOrders.length);
    if (preOrders.length > 0) {
        console.log("First 3 PreOrders createdBy:", preOrders.slice(0, 3).map(p => ({ id: p.id, createdBy: p.createdBy })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
