const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const oldEmail = 'chelsea_supderadmin@gmail.com';
    const newEmail = 'chelsea_superadmin@gmail.com';
    const newPassword = 'password123';

    console.log(`Starting update for ${oldEmail}...`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const updatedUser = await prisma.user.update({
            where: { email: oldEmail },
            data: {
                email: newEmail,
                password: hashedPassword,
            },
        });

        console.log(`Successfully updated user:`);
        console.log(`Old Email: ${oldEmail}`);
        console.log(`New Email: ${updatedUser.email}`);
        console.log(`New Password set to: ${newPassword}`);
    } catch (error) {
        console.error('Error updating user:', error.message);
        if (error.code === 'P2025') {
            console.error('User not found. Please check the email address.');
        }
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
