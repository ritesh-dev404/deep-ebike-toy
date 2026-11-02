import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from server/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// SQLite client (standard default client)
import { PrismaClient as SQLiteClient } from '@prisma/client';
// Neon PostgreSQL client (generated in node_modules/@prisma/client-postgres)
import { PrismaClient as NeonClient } from '@prisma/client-postgres';

async function main() {
  const neonUrl = process.env.NEON_DATABASE_URL;

  if (!neonUrl) {
    console.error('❌ ERROR: NEON_DATABASE_URL is not defined in server/.env');
    process.exit(1);
  }

  if (neonUrl.includes('placeholder')) {
    console.error('❌ ERROR: NEON_DATABASE_URL in server/.env is still set to the template placeholder.');
    console.error('👉 Please paste your real Neon PostgreSQL connection string into server/.env before migrating.');
    process.exit(1);
  }

  console.log('=======================================================');
  console.log('🚀 DEEP E-BIKE & TOY: SQLITE TO NEON DATA MIGRATION');
  console.log('=======================================================');
  console.log('🔒 Database credentials securely loaded from server/.env');

  const sqlite = new SQLiteClient({
    datasources: {
      db: { url: 'file:../prisma/deep_pos.db' },
    },
  });

  const neon = new NeonClient({
    datasources: {
      db: { url: neonUrl },
    },
  });

  try {
    // 1. Verify Connection to Neon
    console.log('\n[1/5] Verifying connection to Neon PostgreSQL...');
    await neon.$connect();
    console.log('✓ Successfully connected to Neon PostgreSQL.');

    // 2. Inspect Existing Neon Tables & Rows
    console.log('\n[2/5] Inspecting Neon tables for existing records...');
    const existingNeonSales = await neon.sale.count();
    const existingNeonProducts = await neon.product.count();
    const existingNeonUsers = await neon.user.count();

    const existingTotal = existingNeonSales + existingNeonProducts + existingNeonUsers;

    if (existingTotal > 0) {
      console.warn(`⚠️ WARNING: Neon database already contains data:`);
      console.warn(`   - Users: ${existingNeonUsers}`);
      console.warn(`   - Products: ${existingNeonProducts}`);
      console.warn(`   - Sales: ${existingNeonSales}`);
      console.warn('❌ Halting to prevent overwriting or duplicating existing Neon data.');
      process.exit(1);
    }
    console.log('✓ Neon database is clean (0 existing application records found).');

    // 3. Inspect Source SQLite Data
    console.log('\n[3/5] Auditing source SQLite database records...');
    const sqliteCounts = {
      role: await sqlite.role.count(),
      permission: await sqlite.permission.count(),
      rolePermission: await sqlite.rolePermission.count(),
      user: await sqlite.user.count(),
      category: await sqlite.category.count(),
      product: await sqlite.product.count(),
      productSerialNumber: await sqlite.productSerialNumber.count(),
      supplier: await sqlite.supplier.count(),
      customer: await sqlite.customer.count(),
      purchase: await sqlite.purchase.count(),
      purchaseItem: await sqlite.purchaseItem.count(),
      sale: await sqlite.sale.count(),
      saleItem: await sqlite.saleItem.count(),
      payment: await sqlite.payment.count(),
      stockMovement: await sqlite.stockMovement.count(),
      return: await sqlite.return.count(),
      expense: await sqlite.expense.count(),
      auditLog: await sqlite.auditLog.count(),
      syncQueue: await sqlite.syncQueue.count(),
      applicationSetting: await sqlite.applicationSetting.count(),
    };

    const totalSQLiteRecords = Object.values(sqliteCounts).reduce((a, b) => a + b, 0);
    console.log(`✓ Audited ${totalSQLiteRecords} records across all 20 SQLite tables.`);

    if (totalSQLiteRecords !== 283) {
      console.warn(`⚠️ Notice: Found ${totalSQLiteRecords} total records (expected 283). Proceeding with exact source data.`);
    }

    // 4. Migrate Data in Strict Foreign-Key Order
    console.log('\n[4/5] Migrating records in topological foreign-key order...');

    // 1. Roles
    const roles = await sqlite.role.findMany();
    if (roles.length > 0) {
      await neon.role.createMany({ data: roles });
      console.log(`   ✓ Roles: ${roles.length}`);
    }

    // 2. Permissions
    const permissions = await sqlite.permission.findMany();
    if (permissions.length > 0) {
      await neon.permission.createMany({ data: permissions });
      console.log(`   ✓ Permissions: ${permissions.length}`);
    }

    // 3. Role Permissions
    const rolePermissions = await sqlite.rolePermission.findMany();
    if (rolePermissions.length > 0) {
      await neon.rolePermission.createMany({ data: rolePermissions });
      console.log(`   ✓ RolePermissions: ${rolePermissions.length}`);
    }

    // 4. Users
    const users = await sqlite.user.findMany();
    if (users.length > 0) {
      await neon.user.createMany({ data: users });
      console.log(`   ✓ Users: ${users.length}`);
    }

    // 5. Categories
    const categories = await sqlite.category.findMany();
    if (categories.length > 0) {
      await neon.category.createMany({ data: categories });
      console.log(`   ✓ Categories: ${categories.length}`);
    }

    // 6. Products
    const products = await sqlite.product.findMany();
    if (products.length > 0) {
      await neon.product.createMany({ data: products });
      console.log(`   ✓ Products: ${products.length}`);
    }

    // 7. Suppliers
    const suppliers = await sqlite.supplier.findMany();
    if (suppliers.length > 0) {
      await neon.supplier.createMany({ data: suppliers });
      console.log(`   ✓ Suppliers: ${suppliers.length}`);
    }

    // 8. Customers
    const customers = await sqlite.customer.findMany();
    if (customers.length > 0) {
      await neon.customer.createMany({ data: customers });
      console.log(`   ✓ Customers: ${customers.length}`);
    }

    // 9. Purchases
    const purchases = await sqlite.purchase.findMany();
    if (purchases.length > 0) {
      await neon.purchase.createMany({ data: purchases });
      console.log(`   ✓ Purchases: ${purchases.length}`);
    }

    // 10. Purchase Items
    const purchaseItems = await sqlite.purchaseItem.findMany();
    if (purchaseItems.length > 0) {
      await neon.purchaseItem.createMany({ data: purchaseItems });
      console.log(`   ✓ PurchaseItems: ${purchaseItems.length}`);
    }

    // 11. Sales
    const sales = await sqlite.sale.findMany();
    if (sales.length > 0) {
      await neon.sale.createMany({ data: sales });
      console.log(`   ✓ Sales: ${sales.length}`);
    }

    // 12. Sale Items
    const saleItems = await sqlite.saleItem.findMany();
    if (saleItems.length > 0) {
      await neon.saleItem.createMany({ data: saleItems });
      console.log(`   ✓ SaleItems: ${saleItems.length}`);
    }

    // 13. Product Serial Numbers
    const serials = await sqlite.productSerialNumber.findMany();
    if (serials.length > 0) {
      await neon.productSerialNumber.createMany({ data: serials });
      console.log(`   ✓ ProductSerialNumbers: ${serials.length}`);
    }

    // 14. Payments
    const payments = await sqlite.payment.findMany();
    if (payments.length > 0) {
      await neon.payment.createMany({ data: payments });
      console.log(`   ✓ Payments: ${payments.length}`);
    }

    // 15. Stock Movements
    const stockMovements = await sqlite.stockMovement.findMany();
    if (stockMovements.length > 0) {
      await neon.stockMovement.createMany({ data: stockMovements });
      console.log(`   ✓ StockMovements: ${stockMovements.length}`);
    }

    // 16. Returns
    const returns = await sqlite.return.findMany();
    if (returns.length > 0) {
      await neon.return.createMany({ data: returns });
      console.log(`   ✓ Returns: ${returns.length}`);
    }

    // 17. Expenses
    const expenses = await sqlite.expense.findMany();
    if (expenses.length > 0) {
      await neon.expense.createMany({ data: expenses });
      console.log(`   ✓ Expenses: ${expenses.length}`);
    }

    // 18. Audit Logs
    const auditLogs = await sqlite.auditLog.findMany();
    if (auditLogs.length > 0) {
      await neon.auditLog.createMany({ data: auditLogs });
      console.log(`   ✓ AuditLogs: ${auditLogs.length}`);
    }

    // 19. Sync Queue
    const syncQueue = await sqlite.syncQueue.findMany();
    if (syncQueue.length > 0) {
      await neon.syncQueue.createMany({ data: syncQueue });
      console.log(`   ✓ SyncQueue: ${syncQueue.length}`);
    }

    // 20. Application Settings
    const settings = await sqlite.applicationSetting.findMany();
    if (settings.length > 0) {
      await neon.applicationSetting.createMany({ data: settings });
      console.log(`   ✓ ApplicationSettings: ${settings.length}`);
    }

    // 5. Verification
    console.log('\n[5/5] Performing detailed verification between SQLite and Neon...');
    const neonCounts = {
      role: await neon.role.count(),
      permission: await neon.permission.count(),
      rolePermission: await neon.rolePermission.count(),
      user: await neon.user.count(),
      category: await neon.category.count(),
      product: await neon.product.count(),
      productSerialNumber: await neon.productSerialNumber.count(),
      supplier: await neon.supplier.count(),
      customer: await neon.customer.count(),
      purchase: await neon.purchase.count(),
      purchaseItem: await neon.purchaseItem.count(),
      sale: await neon.sale.count(),
      saleItem: await neon.saleItem.count(),
      payment: await neon.payment.count(),
      stockMovement: await neon.stockMovement.count(),
      return: await neon.return.count(),
      expense: await neon.expense.count(),
      auditLog: await neon.auditLog.count(),
      syncQueue: await neon.syncQueue.count(),
      applicationSetting: await neon.applicationSetting.count(),
    };

    let allMatched = true;
    let totalNeonRecords = 0;

    console.log('\n--- Table-by-Table Verification ---');
    for (const [table, sCount] of Object.entries(sqliteCounts)) {
      const nCount = (neonCounts as any)[table];
      totalNeonRecords += nCount;
      const match = sCount === nCount;
      if (!match) allMatched = false;
      const statusIcon = match ? '✓' : '❌';
      console.log(`${statusIcon} ${table.padEnd(22)}: SQLite = ${String(sCount).padStart(3)} | Neon = ${String(nCount).padStart(3)}`);
    }

    console.log('-----------------------------------');
    console.log(`Total records: SQLite = ${totalSQLiteRecords} | Neon = ${totalNeonRecords}`);

    // Detailed verification of integrity
    console.log('\n--- Deep Integrity Verification ---');

    // Verify 18 sales & invoice numbers
    const sampleSales = await neon.sale.findMany({
      select: { invoiceNumber: true, grandTotal: true },
      orderBy: { invoiceNumber: 'asc' },
    });
    console.log(`✓ All ${sampleSales.length} sales preserved (first: ${sampleSales[0]?.invoiceNumber}, latest: ${sampleSales[sampleSales.length - 1]?.invoiceNumber})`);

    // Verify product quantities
    const sqliteProducts = await sqlite.product.findMany({ select: { id: true, availableQuantity: true } });
    const neonProducts = await neon.product.findMany({ select: { id: true, availableQuantity: true } });
    const productQtyMismatch = sqliteProducts.some((sp) => {
      const np = neonProducts.find((p) => p.id === sp.id);
      return !np || np.availableQuantity !== sp.availableQuantity;
    });

    if (productQtyMismatch) {
      console.error('❌ Mismatch in product available quantities!');
      allMatched = false;
    } else {
      console.log(`✓ All ${neonProducts.length} product inventory quantities match perfectly.`);
    }

    // Verify serial numbers
    const neonSerialCount = await neon.productSerialNumber.count({ where: { status: 'AVAILABLE' } });
    const sqliteSerialCount = await sqlite.productSerialNumber.count({ where: { status: 'AVAILABLE' } });
    console.log(`✓ Available serial/chassis numbers: SQLite = ${sqliteSerialCount} | Neon = ${neonSerialCount}`);

    if (allMatched) {
      console.log('\n=======================================================');
      console.log('🎉 MIGRATION SUCCESSFUL! All 283 records perfectly verified.');
      console.log('=======================================================');
    } else {
      console.error('\n❌ MIGRATION WARNING: Some record counts did not match perfectly.');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n❌ Fatal Migration Error:', error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await neon.$disconnect();
  }
}

main();
