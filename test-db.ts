import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('Branches:', await prisma.branch.findMany());
    console.log('Users:', await prisma.user.findMany({ select: { id: true, name: true, branchId: true } }));
    console.log('Roles:', await prisma.role.findMany());
}
main().finally(() => prisma.$disconnect());
