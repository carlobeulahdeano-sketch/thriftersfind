const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
    try {
        console.log("Attempting to query database...");
        const admin = await prisma.user.findFirst();
        console.log("Laragon DB connection is OK!");
        process.exit(0);
    } catch (err) {
        console.error("Laragon connection failed:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}
test();
