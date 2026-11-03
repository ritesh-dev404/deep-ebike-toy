import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client-postgres';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const neonUrl = process.env.NEON_DATABASE_URL;

if (!neonUrl || neonUrl.includes('placeholder')) {
  console.error('ERROR: NEON_DATABASE_URL is not set or contains placeholder.');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: neonUrl },
  },
  log: ['error'],
});

async function main() {
  try {
    console.log('Testing Neon PostgreSQL connection...');
    await prisma.$connect();
    console.log('Connection successful: Successfully connected to Neon PostgreSQL.');

    // Query existing public tables
    const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`Found ${tables.length} existing base tables in public schema.`);

    let totalRecords = 0;
    const tableSummaries: Array<{ table: string; count: number }> = [];

    for (const t of tables) {
      const escapedTable = t.table_name.replace(/"/g, '""');
      const countResult: Array<{ count: bigint }> = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM "${escapedTable}";`
      );
      const count = Number(countResult[0]?.count || 0);
      tableSummaries.push({ table: t.table_name, count });
      totalRecords += count;
    }

    if (tables.length > 0) {
      console.log('Existing tables summary:');
      for (const item of tableSummaries) {
        console.log(`  - ${item.table}: ${item.count} records`);
      }
      console.log(`Total existing records across all tables: ${totalRecords}`);
    } else {
      console.log('Database is completely empty (0 tables).');
    }

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('Neon connection / inspection failed:');
    // Sanitize any potential URL in error message
    const msg = (error.message || String(error)).replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***:***@');
    console.error(msg);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
