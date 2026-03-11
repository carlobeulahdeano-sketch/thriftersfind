const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const sql = fs.readFileSync('migration.sql', 'utf8');
    // Split statements properly handling comments might be tricky. Basic split by `;`
    const lines = sql.split('\n');
    const cleaned = lines.filter(l => !l.trim().startsWith('--')).join('\n');
    const statements = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute.`);

    for (let stmt of statements) {
        try {
            await prisma.$executeRawUnsafe(stmt);
            // console.log(`OK: ${stmt.substring(0, 60)}...`);
        } catch (err) {
            const isExpected =
                stmt.includes('DROP FOREIGN KEY') ||
                stmt.includes('ADD COLUMN') ||
                stmt.includes('Duplicate column name') ||
                err.message.includes('check that column/key exists') ||
                err.message.includes('Duplicate column name') ||
                err.message.includes('Can\'t DROP');

            if (isExpected) {
                console.log(`Ignored (already applied or missing): ${stmt.substring(0, 50)}...`);
            } else {
                console.error(`\nFATAL ERROR on:\n${stmt}\nError: ${err.message}\n`);
                process.exit(1);
            }
        }
    }
    console.log('Migration script finished safely!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
