import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all sales logs...");
    const logs = await prisma.salesLog.findMany({ take: 5, orderBy: { createdAt: 'desc' } });

    console.log("Sample log.orders type:", typeof logs[0]?.orders, logs[0]?.orders);

    // Let's try to filter using string_contains if it is cast as string, or path if it's JSON
    const testUserId = logs[0]?.orders ? (typeof logs[0].orders === 'string' ? JSON.parse(logs[0].orders) : logs[0].orders)?.createdBy?.uid : null;

    if (testUserId) {
        console.log("Testing filter with testUserId:", testUserId);
        try {
            const filtered1 = await prisma.salesLog.findMany({
                where: {
                    orders: {
                        path: '$.createdBy.uid',
                        equals: testUserId
                    }
                }
            });
            console.log("Filtered with path:", filtered1.length);
        } catch (e: any) {
            console.log("Path filter failed:", e.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
