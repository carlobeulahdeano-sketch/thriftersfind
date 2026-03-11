const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Roles
    const roles = ['staff', 'super admin'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
    console.log('Roles seeded.');

    // Branches
    const branches = ['branch 1', 'branch2', 'main branch'];
    for (const branchName of branches) {
        await prisma.branch.upsert({
            where: { name: branchName },
            update: {},
            create: { name: branchName },
        });
    }
    console.log('Branches seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
