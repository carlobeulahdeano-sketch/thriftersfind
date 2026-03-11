import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst();
    if (!user) return;

    const idNum = user.id; // Usually 1

    console.log("Testing with number:", idNum);
    const withNum = await prisma.preOrder.findMany({
        where: {
            createdBy: {
                path: "$.uid",
                equals: idNum,
            }
        }
    });
    console.log("Found with number:", withNum.length);

    console.log("Testing with string:", String(idNum));
    try {
        const withStr = await prisma.preOrder.findMany({
            where: {
                createdBy: {
                    path: "$.uid",
                    equals: String(idNum),
                }
            }
        });
        console.log("Found with string:", withStr.length);
    } catch (e: any) {
        console.log("Error with string:", e.message);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
