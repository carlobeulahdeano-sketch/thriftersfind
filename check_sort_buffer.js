const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSortBuffer() {
  try {
    const result = await prisma.$queryRaw`SHOW VARIABLES LIKE 'sort_buffer_size'`;
    console.log('Current sort_buffer_size:', result);
    
    // Testing if we can increase it for the session
    await prisma.$executeRaw`SET SESSION sort_buffer_size = 1048576`; // 1MB
    const after = await prisma.$queryRaw`SHOW VARIABLES LIKE 'sort_buffer_size'`;
    console.log('After setting session sort_buffer_size:', after);

    // Also check global
    const globalResult = await prisma.$queryRaw`SHOW GLOBAL VARIABLES LIKE 'sort_buffer_size'`;
    console.log('Global sort_buffer_size:', globalResult);

  } catch (error) {
    console.error('Error checking sort buffer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSortBuffer();
