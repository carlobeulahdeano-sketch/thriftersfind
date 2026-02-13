const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting restoration of roles, branches, and admin permissions...');

    // 1. Re-seed Branches and Roles
    const branches = ['Branch 1', 'Branch 2'];
    const roles = ['super admin', 'staff'];

    for (const branchName of branches) {
        await prisma.branch.upsert({
            where: { name: branchName },
            update: {},
            create: { name: branchName },
        });
    }

    // Capture super admin role ID
    let superAdminRole;
    for (const roleName of roles) {
        const role = await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
        if (roleName === 'super admin') {
            superAdminRole = role;
        }
    }

    console.log('Roles and Branches re-seeded.');

    if (!superAdminRole) {
        console.error('Failed to find or create super admin role!');
        return;
    }

    // 2. Find and Update Super Admin User
    // Try to find by multiple potential identifiers as we preserved users
    const potentialEmails = ['chelsea_superadmin@gmail.com', 'superadmin@gmail.com', 'admin@thriftersfind.com'];

    // Also try to find a user who WAS a super admin based on role string if possible, or just the first user if we can't find by email?
    // Safer to stick to known emails or find *any* user and ask.
    // Let's search for the user the user specifically mentioned before: chelsea_superadmin@gmail.com
    // And also the fallback from seed-all.js: superadmin@gmail.com

    let adminUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: 'chelsea_superadmin@gmail.com' },
                { email: 'superadmin@gmail.com' },
                // Fallback: Find a user with 'admin' in email
                { email: { contains: 'admin' } }
            ]
        }
    });

    if (adminUser) {
        console.log(`Found potential admin user: ${adminUser.email} (${adminUser.name})`);

        // Update the user
        await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                roleId: superAdminRole.id,
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
            }
        });
        console.log(`Successfully restored super admin permissions for user: ${adminUser.email}`);
    } else {
        console.log('No user found matching known admin emails. Listing all users to help debug:');
        const allUsers = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true } });
        console.table(allUsers);
        console.log('Please check the list above and manually update the script with the correct email if needed.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
