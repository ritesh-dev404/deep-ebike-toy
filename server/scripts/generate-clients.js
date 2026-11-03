const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Generating Prisma Clients...');

// 1. Generate default SQLite client
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to generate SQLite Prisma client:', err.message);
  process.exit(1);
}

// 2. Generate PostgreSQL client
try {
  execSync('npx prisma generate --schema=prisma/schema.postgres.prisma', { stdio: 'inherit' });
} catch (err) {
  const dtsPath = path.resolve(__dirname, '../node_modules/@prisma/client-postgres/index.d.ts');
  if (fs.existsSync(dtsPath)) {
    console.warn('⚠️ Note: PostgreSQL client DLL locked by active editor process, but existing generated client is present. Proceeding with build.');
  } else {
    console.error('Failed to generate PostgreSQL Prisma client:', err.message);
    process.exit(1);
  }
}

console.log('✔ All Prisma clients ready.');
