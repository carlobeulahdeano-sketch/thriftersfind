
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.update({
        where: { id: 'cmlj1arl50005rbdwihjxegr5' },
        data: {
            permissions: {
                sales: true,
                users: true,
                orders: false,
                batches: false,
                reports: true,
                settings: true,
                stations: true,
                customers: true,
                dashboard: true,
                inventory: false,
                preOrders: true,
                warehouses: true,
                adminManage: true
            }
        }
    });
    console.log('Permissions updated for Super Admin');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
