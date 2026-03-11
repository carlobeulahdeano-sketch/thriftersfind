const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSortBuffer() {
  try {
    console.log('Attempting to set GLOBAL sort_buffer_size to 1MB...');
    await prisma.$executeRawUnsafe(`SET GLOBAL sort_buffer_size = 1048576`);
    console.log('Successfully set GLOBAL sort_buffer_size.');
    
    const result = await prisma.$queryRawUnsafe(`SHOW GLOBAL VARIABLES LIKE 'sort_buffer_size'`);
    console.log('New Global sort_buffer_size:', result);

  } catch (error) {
    console.error('Failed to set global sort buffer (might need SUPER privileges):', error.message);
    
    try {
        console.log('Attempting to set SESSION sort_buffer_size as fallback...');
        await prisma.$executeRawUnsafe(`SET SESSION sort_buffer_size = 1048576`);
        console.log('Successfully set SESSION sort_buffer_size.');
    } catch (e2) {
        console.error('Failed to set session sort buffer:', e2.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

fixSortBuffer();
