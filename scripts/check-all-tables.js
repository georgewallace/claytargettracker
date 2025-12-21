const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllTables() {
  console.log('🔍 Checking all tables in database...\n');
  console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');

  try {
    // Query the database schema to list all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`Found ${tables.length} tables:\n`);

    for (const table of tables) {
      const tableName = table.table_name;

      try {
        const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}";`);
        const count = Number(result[0].count);

        if (count > 0) {
          console.log(`✓ ${tableName}: ${count} rows`);
        } else {
          console.log(`  ${tableName}: 0 rows`);
        }
      } catch (err) {
        console.log(`  ${tableName}: ERROR - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAllTables();
