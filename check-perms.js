
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            role_rel: true,
        }
    });

    for (const user of users) {
        if (user.role_rel?.name?.toLowerCase() === 'staff') {
            console.log('--- STAFF USER ---');
            console.log(`Email: ${user.email}`);
            console.log(`Permissions Type: ${typeof user.permissions}`);
            console.log(`Permissions Content: ${JSON.stringify(user.permissions, null, 2)}`);
        }
    }

    await prisma.$disconnect();
}

main().catch(console.error);
