const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding branches and roles...');

    const branches = ['Branch 1', 'Branch 2'];
    const roles = ['super admin', 'staff'];

    for (const branchName of branches) {
        await prisma.branch.upsert({
            where: { name: branchName },
            update: {},
            create: { name: branchName },
        });
    }

    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }

    console.log('Seeding completed successfully!');

    // Create Super Admin User
    console.log('Creating super admin user...');

    // hash password
    const hashedPassword = await bcrypt.hash('password', 10);

    // Find the super admin role
    const superAdminRole = await prisma.role.findUnique({
        where: { name: 'super admin' }
    });

    if (superAdminRole) {
        await prisma.user.upsert({
            where: { email: 'superadmin@gmail.com' },
            update: {
                roleId: superAdminRole.id, // Ensure role is linked if user exists
                role: 'super admin',
                permissions: {
                    dashboard: true,
                    orders: true,
                    batches: true,
                    inventory: true,
                    customers: true,
                    reports: true,
                    users: true,
                    settings: true,
                    adminManage: true,
                    stations: true,
                    preOrders: true,
                    warehouses: true
                }
            },
            create: {
                name: 'Super Admin',
                email: 'superadmin@gmail.com',
                password: hashedPassword,
                role: 'super admin',
                roleId: superAdminRole.id,
                permissions: {
                    dashboard: true,
                    orders: true,
                    batches: true,
                    inventory: true,
                    customers: true,
                    reports: true,
                    users: true,
                    settings: true,
                    adminManage: true,
                    stations: true,
                    preOrders: true,
                    warehouses: true
                }
            }
        });
        console.log('Super admin user created: superadmin@gmail.com / password');
    } else {
        console.error('Super admin role not found, skipping user creation.');
    }

    console.log('Seeding process finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
