import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for DEEP E-BIKE & TOY...');

  // 1. Roles
  const ownerRole = await prisma.role.upsert({
    where: { name: 'OWNER' },
    update: {},
    create: {
      name: 'OWNER',
      description: 'Shop Owner with unrestricted system access and financial controls',
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Store Sales Associate with billing, search, and invoice printing access',
    },
  });

  console.log('✓ Roles seeded (OWNER, EMPLOYEE)');

  // 2. Permissions
  const permissionsList = [
    { name: 'SALES_CREATE', module: 'SALES', action: 'CREATE', description: 'Create new sale bills' },
    { name: 'SALES_READ', module: 'SALES', action: 'READ', description: 'View sales and invoices' },
    { name: 'SALES_CANCEL', module: 'SALES', action: 'CANCEL', description: 'Cancel existing sales' },
    { name: 'PRODUCTS_READ', module: 'PRODUCTS', action: 'READ', description: 'Search and view products' },
    { name: 'PRODUCTS_MANAGE', module: 'PRODUCTS', action: 'MANAGE', description: 'Create and update products' },
    { name: 'PRODUCTS_PURCHASE_PRICE_VIEW', module: 'PRODUCTS', action: 'READ_PRICE', description: 'View product cost prices' },
    { name: 'PURCHASES_MANAGE', module: 'PURCHASES', action: 'MANAGE', description: 'Manage supplier purchases and stock in' },
    { name: 'STOCK_MANAGE', module: 'STOCK', action: 'MANAGE', description: 'Perform manual stock adjustments' },
    { name: 'REPORTS_VIEW', module: 'REPORTS', action: 'READ', description: 'View profit, financial and sales reports' },
    { name: 'CUSTOMERS_MANAGE', module: 'CUSTOMERS', action: 'MANAGE', description: 'Add and view customers' },
    { name: 'SUPPLIERS_MANAGE', module: 'SUPPLIERS', action: 'MANAGE', description: 'Manage suppliers' },
    { name: 'USERS_MANAGE', module: 'USERS', action: 'MANAGE', description: 'Create and manage employee accounts' },
    { name: 'SETTINGS_MANAGE', module: 'SETTINGS', action: 'MANAGE', description: 'Configure shop and sync settings' },
  ];

  for (const perm of permissionsList) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });

    // Owner gets all
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: ownerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: ownerRole.id,
        permissionId: permission.id,
      },
    });

    // Employee gets selected
    if (['SALES_CREATE', 'SALES_READ', 'PRODUCTS_READ', 'CUSTOMERS_MANAGE'].includes(perm.name)) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: employeeRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log('✓ Permissions seeded and assigned');

  // 3. Default Users
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const ownerUser = await prisma.user.upsert({
    where: { username: 'owner' },
    update: { passwordHash },
    create: {
      username: 'owner',
      email: 'owner@deepebikeandtoy.com',
      passwordHash,
      fullName: 'Deepak Sharma (Owner)',
      phone: '9876543210',
      roleId: ownerRole.id,
      isActive: true,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { username: 'employee' },
    update: { passwordHash },
    create: {
      username: 'employee',
      email: 'rahul@deepebikeandtoy.com',
      passwordHash,
      fullName: 'Rahul Verma (Sales Associate)',
      phone: '9123456780',
      roleId: employeeRole.id,
      isActive: true,
    },
  });

  console.log('✓ Default users seeded:');
  console.log('  Owner: username="owner", password="Password@123"');
  console.log('  Employee: username="employee", password="Password@123"');

  // 4. Categories
  const categoriesData = [
    { name: 'Electric Bikes', code: 'E-BIKE', description: 'Battery-powered smart electric cycles and mopeds' },
    { name: 'Electric Scooters', code: 'E-SCOOTER', description: 'High-speed and low-speed electric scooters' },
    { name: 'Kids Electric Cars', code: 'KIDS-CAR', description: 'Rechargeable ride-on cars with remote controls' },
    { name: 'Kids Electric Bikes', code: 'KIDS-BIKE', description: 'Battery operated kids motorbikes and quads' },
    { name: 'Electric Toys', code: 'E-TOY', description: 'RC drones, robot toys, and drift cars' },
    { name: 'Regular Toys', code: 'REG-TOY', description: 'Board games, building blocks, and plushies' },
    { name: 'Accessories', code: 'ACCESSORY', description: 'Helmets, safety gear, LED lights, locks, and covers' },
    { name: 'Spare Parts', code: 'SPARE-PART', description: 'Lithium batteries, BLDC controllers, throttles, and tyres' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
    categoryMap.set(cat.code, createdCat.id);
  }
  console.log('✓ 8 Shop Categories seeded');

  // 5. Suppliers
  const suppliersData = [
    {
      name: 'VoltPower EV Dynamics Pvt Ltd',
      contactPerson: 'Arun Mehra',
      phone: '9811223344',
      email: 'sales@voltpowerev.com',
      address: 'Plot 45, Phase 2 Industrial Area, Gurgaon, Haryana',
      gstNumber: '06AAACV1234A1Z1',
      outstandingBalance: 0,
    },
    {
      name: 'ToyJoy Global Imports',
      contactPerson: 'Kavita Patel',
      phone: '9822334455',
      email: 'orders@toyjoyimports.in',
      address: 'Gala 102, Bhiwandi Logistics Park, Mumbai, MH',
      gstNumber: '27AABCT5678B1Z2',
      outstandingBalance: 15000,
    },
    {
      name: 'Apex Lithium & Electronics Tech',
      contactPerson: 'Suresh Rao',
      phone: '9833445566',
      email: 'support@apexcomponents.in',
      address: '5th Cross, Peenya Industrial Estate, Bengaluru, KA',
      gstNumber: '29AACCA9012C1Z3',
      outstandingBalance: 0,
    },
  ];

  const supplierMap = new Map<string, string>();
  for (const sup of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { phone: sup.phone } });
    if (!existing) {
      const created = await prisma.supplier.create({ data: sup });
      supplierMap.set(sup.name, created.id);
    } else {
      supplierMap.set(sup.name, existing.id);
    }
  }
  console.log('✓ Suppliers seeded');

  // 6. Customers
  const customersData = [
    {
      name: 'Vikram Malhotra',
      phone: '9899001122',
      email: 'vikram.m@gmail.com',
      address: 'Flat 402, Sunshine Heights, Civil Lines',
      totalPurchases: 45499,
    },
    {
      name: 'Pooja Singhania',
      phone: '9877112233',
      email: 'pooja.s@yahoo.com',
      address: 'B-12, Green Avenue, Model Town',
      totalPurchases: 18498,
    },
    {
      name: 'Amitabh Sen',
      phone: '9811998877',
      email: 'amitabh.sen@outlook.com',
      address: 'House 78, Sector 15',
      totalPurchases: 7299,
    },
  ];

  const customerMap = new Map<string, string>();
  for (const cust of customersData) {
    const createdCust = await prisma.customer.upsert({
      where: { phone: cust.phone },
      update: {},
      create: cust,
    });
    customerMap.set(cust.phone, createdCust.id);
  }
  console.log('✓ Customers seeded');

  // 7. Products
  const productsData = [
    {
      productCode: 'DEB-001',
      name: 'Deep Thunder Pro E-Bike 250W',
      categoryCode: 'E-BIKE',
      brand: 'Deep EV',
      modelNumber: 'TP-250',
      barcode: '8901234001',
      purchasePrice: 28000,
      sellingPrice: 38500,
      gstRate: 5,
      availableQuantity: 5,
      minStockLevel: 2,
      isSerialTracked: true,
      description: 'Lithium battery 36V 10.4Ah, 45km range per charge, dual disc brakes, LED display.',
    },
    {
      productCode: 'DEB-002',
      name: 'EcoRider City Cruiser E-Bike',
      categoryCode: 'E-BIKE',
      brand: 'EcoRider',
      modelNumber: 'CC-100',
      barcode: '8901234002',
      purchasePrice: 22000,
      sellingPrice: 31999,
      gstRate: 5,
      availableQuantity: 4,
      minStockLevel: 2,
      isSerialTracked: true,
      description: 'Lightweight alloy frame, 7-speed Shimano gear, removable battery.',
    },
    {
      productCode: 'DES-001',
      name: 'SpeedVolt Falcon S1 High-Speed Scooter',
      categoryCode: 'E-SCOOTER',
      brand: 'SpeedVolt',
      modelNumber: 'SV-FS1',
      barcode: '8901234003',
      purchasePrice: 48000,
      sellingPrice: 64000,
      gstRate: 5,
      availableQuantity: 4,
      minStockLevel: 2,
      isSerialTracked: true,
      description: '60V 30Ah Lithium battery, 80km top speed, 100km range, digital instrument cluster.',
    },
    {
      productCode: 'DES-002',
      name: 'GlidePro Urban Scooter 60V',
      categoryCode: 'E-SCOOTER',
      brand: 'GlidePro',
      modelNumber: 'GP-60',
      barcode: '8901234004',
      purchasePrice: 36000,
      sellingPrice: 49500,
      gstRate: 5,
      availableQuantity: 3,
      minStockLevel: 2,
      isSerialTracked: true,
      description: 'Regenerative braking, tubeless tyres, USB phone charging port, anti-theft GPS alarm.',
    },
    {
      productCode: 'DKC-001',
      name: 'Kids Mercedes G-Wagon 12V Ride-On Car',
      categoryCode: 'KIDS-CAR',
      brand: 'ToyJoy',
      modelNumber: 'GW-12V',
      barcode: '8901234005',
      purchasePrice: 9500,
      sellingPrice: 15999,
      gstRate: 18,
      availableQuantity: 7,
      minStockLevel: 3,
      isSerialTracked: true,
      description: 'Dual motors, Bluetooth music player, parental 2.4G remote control, opening doors.',
    },
    {
      productCode: 'DKC-002',
      name: 'Kids Lamborghini Aventador Dual Motor Car',
      categoryCode: 'KIDS-CAR',
      brand: 'ToyJoy',
      modelNumber: 'LAM-DM',
      barcode: '8901234006',
      purchasePrice: 12000,
      sellingPrice: 19500,
      gstRate: 18,
      availableQuantity: 4,
      minStockLevel: 2,
      isSerialTracked: true,
      description: 'Hydraulic scissor doors, LED headlights, leather seat with seatbelt, soft start.',
    },
    {
      productCode: 'DKB-001',
      name: 'Kids Ninja Superbike 6V Electric Bike',
      categoryCode: 'KIDS-BIKE',
      brand: 'ToyJoy',
      modelNumber: 'NJ-6V',
      barcode: '8901234007',
      purchasePrice: 4200,
      sellingPrice: 6999,
      gstRate: 18,
      availableQuantity: 8,
      minStockLevel: 3,
      isSerialTracked: true,
      description: 'Hand throttle, foot brake, training support wheels, engine roar sound simulator.',
    },
    {
      productCode: 'DKB-002',
      name: 'Kids Police Patrol Quad Bike 12V',
      categoryCode: 'KIDS-BIKE',
      brand: 'ToyJoy',
      modelNumber: 'POL-12',
      barcode: '8901234008',
      purchasePrice: 7000,
      sellingPrice: 11499,
      gstRate: 18,
      availableQuantity: 6,
      minStockLevel: 2,
      isSerialTracked: true,
      description: 'Flashing police beacon lights, siren sounds, all-terrain tires, rear luggage box.',
    },
    {
      productCode: 'DET-001',
      name: 'Stunt RC Drone with 4K Camera',
      categoryCode: 'E-TOY',
      brand: 'SkyDrone',
      modelNumber: 'DRN-4K',
      barcode: '8901234009',
      purchasePrice: 1800,
      sellingPrice: 3499,
      gstRate: 18,
      availableQuantity: 15,
      minStockLevel: 4,
      isSerialTracked: false,
      description: 'Altitude hold, 360 degree flip, Wi-Fi FPV live video feed to mobile app.',
    },
    {
      productCode: 'DET-002',
      name: 'High-Speed Drift RC Monster Truck',
      categoryCode: 'E-TOY',
      brand: 'HyperSpeed',
      modelNumber: 'RC-MT01',
      barcode: '8901234010',
      purchasePrice: 1200,
      sellingPrice: 2299,
      gstRate: 18,
      availableQuantity: 18,
      minStockLevel: 5,
      isSerialTracked: false,
      description: '4WD all-metal shocks, 45 km/h high speed, waterproof electronics.',
    },
    {
      productCode: 'DRT-001',
      name: 'Magnetic Building Tiles 100-Piece Set',
      categoryCode: 'REG-TOY',
      brand: 'PlayKids',
      modelNumber: 'MAG-100',
      barcode: '8901234011',
      purchasePrice: 650,
      sellingPrice: 1299,
      gstRate: 12,
      availableQuantity: 24,
      minStockLevel: 5,
      isSerialTracked: false,
      description: 'STEM educational 3D magnetic geometrical builder blocks for creative learning.',
    },
    {
      productCode: 'DRT-002',
      name: 'Wooden Educational Train & Track Set',
      categoryCode: 'REG-TOY',
      brand: 'PlayKids',
      modelNumber: 'WTT-50',
      barcode: '8901234012',
      purchasePrice: 450,
      sellingPrice: 899,
      gstRate: 12,
      availableQuantity: 16,
      minStockLevel: 4,
      isSerialTracked: false,
      description: 'Eco-friendly natural beechwood train tracks with magnetic locomotives and bridge.',
    },
    {
      productCode: 'DAC-001',
      name: 'Smart LED Helmet with Turn Signals',
      categoryCode: 'ACCESSORY',
      brand: 'SafeRider',
      modelNumber: 'HLM-LED',
      barcode: '8901234013',
      purchasePrice: 1100,
      sellingPrice: 2199,
      gstRate: 18,
      availableQuantity: 12,
      minStockLevel: 3,
      isSerialTracked: false,
      description: 'Handlebar wireless remote controlled turning indicators, brake auto-light sensing.',
    },
    {
      productCode: 'DAC-002',
      name: 'Heavy-Duty Anti-Theft Bike Chain Lock',
      categoryCode: 'ACCESSORY',
      brand: 'SafeRider',
      modelNumber: 'LCK-HD',
      barcode: '8901234014',
      purchasePrice: 350,
      sellingPrice: 799,
      gstRate: 18,
      availableQuantity: 28,
      minStockLevel: 5,
      isSerialTracked: false,
      description: '10mm hardened manganese steel chain with anti-pick lock cylinder.',
    },
    {
      productCode: 'DSP-001',
      name: '48V 24Ah Lithium-Ion E-Bike Battery Pack',
      categoryCode: 'SPARE-PART',
      brand: 'Apex Power',
      modelNumber: 'BAT-48V',
      barcode: '8901234015',
      purchasePrice: 11500,
      sellingPrice: 16500,
      gstRate: 18,
      availableQuantity: 5,
      minStockLevel: 2,
      isSerialTracked: true,
      description: 'Grade-A NMC cells, integrated Smart BMS with thermal and short circuit protection.',
    },
    {
      productCode: 'DSP-002',
      name: 'Smart Fast Charger 48V 3A',
      categoryCode: 'SPARE-PART',
      brand: 'Apex Power',
      modelNumber: 'CHG-48V',
      barcode: '8901234016',
      purchasePrice: 900,
      sellingPrice: 1650,
      gstRate: 18,
      availableQuantity: 14,
      minStockLevel: 3,
      isSerialTracked: false,
      description: 'CC-CV automatic cut-off fast charger with cooling fan and LED charging status.',
    },
    {
      productCode: 'DSP-003',
      name: 'Tubeless E-Scooter Tyre 10x2.5',
      categoryCode: 'SPARE-PART',
      brand: 'RoadGrip',
      modelNumber: 'TYR-10X',
      barcode: '8901234017',
      purchasePrice: 550,
      sellingPrice: 1150,
      gstRate: 18,
      availableQuantity: 2, // Low stock demo!
      minStockLevel: 5,
      isSerialTracked: false,
      description: 'Puncture-resistant heavy rubber compound for urban electric scooters.',
    },
  ];

  for (const prod of productsData) {
    const categoryId = categoryMap.get(prod.categoryCode);
    if (!categoryId) continue;

    const createdProd = await prisma.product.upsert({
      where: { productCode: prod.productCode },
      update: {
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        availableQuantity: prod.availableQuantity,
      },
      create: {
        productCode: prod.productCode,
        name: prod.name,
        categoryId,
        brand: prod.brand,
        modelNumber: prod.modelNumber,
        barcode: prod.barcode,
        purchasePrice: prod.purchasePrice,
        sellingPrice: prod.sellingPrice,
        gstRate: prod.gstRate,
        availableQuantity: prod.availableQuantity,
        minStockLevel: prod.minStockLevel,
        isSerialTracked: prod.isSerialTracked,
        description: prod.description,
        status: prod.availableQuantity <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
      },
    });

    // If serial tracked, add available chassis / serial numbers
    if (prod.isSerialTracked) {
      for (let i = 1; i <= prod.availableQuantity; i++) {
        const serialNo = `${prod.productCode}-SN${String(i).padStart(4, '0')}`;
        const chassisNo = `CHS-${prod.productCode}-${String(i).padStart(4, '0')}`;
        await prisma.productSerialNumber.upsert({
          where: { serialNumber: serialNo },
          update: {},
          create: {
            productId: createdProd.id,
            serialNumber: serialNo,
            chassisNumber: chassisNo,
            status: 'AVAILABLE',
            notes: 'Factory fresh inventory',
          },
        });
      }
    }
  }

  console.log('✓ 17 Shop Products seeded with serial numbers and initial inventory');

  // 8. Sample Historical Sales for Instant Dashboard Charts & Reports
  const thunderBike = await prisma.product.findUnique({ where: { productCode: 'DEB-001' } });
  const lamboCar = await prisma.product.findUnique({ where: { productCode: 'DKC-002' } });
  const rcDrone = await prisma.product.findUnique({ where: { productCode: 'DET-001' } });
  const vikramCustId = customerMap.get('9899001122');
  const poojaCustId = customerMap.get('9877112233');

  if (thunderBike && vikramCustId) {
    const existingSale = await prisma.sale.findUnique({ where: { invoiceNumber: 'INV-2026-0001' } });
    if (!existingSale) {
      const sale = await prisma.sale.create({
        data: {
          invoiceNumber: 'INV-2026-0001',
          customerId: vikramCustId,
          customerName: 'Vikram Malhotra',
          customerPhone: '9899001122',
          saleDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          subtotal: 36666.67,
          taxAmount: 1833.33,
          discountAmount: 0,
          grandTotal: 38500,
          paymentMethod: 'UPI',
          paymentStatus: 'PAID',
          amountReceived: 38500,
          changeAmount: 0,
          status: 'COMPLETED',
          notes: 'Customer opted for UPI on QR code',
          createdById: employeeUser.id,
          isSynced: true,
          items: {
            create: [
              {
                productId: thunderBike.id,
                productName: thunderBike.name,
                quantity: 1,
                unitPrice: 38500,
                costPrice: 28000,
                gstRate: 5,
                taxAmount: 1833.33,
                discount: 0,
                totalPrice: 38500,
                serialNumbersJson: JSON.stringify(['DEB-001-SN0099']),
              },
            ],
          },
          payments: {
            create: [
              {
                referenceType: 'SALE',
                amount: 38500,
                paymentMethod: 'UPI',
                transactionRef: 'UPI/261031987654/Deep',
                createdById: employeeUser.id,
              },
            ],
          },
        },
      });

      await prisma.stockMovement.create({
        data: {
          productId: thunderBike.id,
          movementType: 'SALE',
          quantity: -1,
          previousStock: 6,
          newStock: 5,
          referenceId: sale.id,
          referenceType: 'SALE',
          notes: 'Sold on INV-2026-0001',
          createdById: employeeUser.id,
        },
      });
    }
  }

  if (lamboCar && rcDrone && poojaCustId) {
    const existingSale2 = await prisma.sale.findUnique({ where: { invoiceNumber: 'INV-2026-0002' } });
    if (!existingSale2) {
      const sale2 = await prisma.sale.create({
        data: {
          invoiceNumber: 'INV-2026-0002',
          customerId: poojaCustId,
          customerName: 'Pooja Singhania',
          customerPhone: '9877112233',
          saleDate: new Date(), // Today
          subtotal: 19490.68,
          taxAmount: 3508.32,
          discountAmount: 0,
          grandTotal: 22999,
          paymentMethod: 'CARD',
          paymentStatus: 'PAID',
          amountReceived: 23000,
          changeAmount: 1,
          status: 'COMPLETED',
          notes: 'Birthday gift purchase for son',
          createdById: ownerUser.id,
          isSynced: true,
          items: {
            create: [
              {
                productId: lamboCar.id,
                productName: lamboCar.name,
                quantity: 1,
                unitPrice: 19500,
                costPrice: 12000,
                gstRate: 18,
                taxAmount: 2974.58,
                discount: 0,
                totalPrice: 19500,
                serialNumbersJson: JSON.stringify(['DKC-002-SN0088']),
              },
              {
                productId: rcDrone.id,
                productName: rcDrone.name,
                quantity: 1,
                unitPrice: 3499,
                costPrice: 1800,
                gstRate: 18,
                taxAmount: 533.74,
                discount: 0,
                totalPrice: 3499,
              },
            ],
          },
          payments: {
            create: [
              {
                referenceType: 'SALE',
                amount: 22999,
                paymentMethod: 'CARD',
                transactionRef: 'POS-TXN-887711',
                createdById: ownerUser.id,
              },
            ],
          },
        },
      });
    }
  }

  // 9. Application Settings
  const defaultSettings = [
    { key: 'SHOP_NAME', value: 'DEEP E-BIKE & TOY', description: 'Store Registered Name' },
    { key: 'SHOP_TAGLINE', value: 'Electric Bikes, Scooters, Kids Ride-On & Toys', description: 'Store Tagline' },
    { key: 'SHOP_ADDRESS', value: 'Shop No. 12-14, Green Park Main Road, City Center', description: 'Store Physical Address' },
    { key: 'SHOP_PHONE', value: '+91 98765 43210 / +91 91234 56789', description: 'Contact Numbers' },
    { key: 'SHOP_EMAIL', value: 'contact@deepebikeandtoy.com', description: 'Store Email' },
    { key: 'SHOP_GSTIN', value: '27ABCDE1234F1Z5', description: 'Goods & Services Tax Identification Number' },
    { key: 'CURRENCY_SYMBOL', value: '₹', description: 'Default Currency Symbol' },
    { key: 'INVOICE_PREFIX', value: 'INV-2026-', description: 'Invoice Number Prefix' },
    { key: 'DEFAULT_PRINT_FORMAT', value: 'THERMAL_80MM', description: 'Default Print Layout (A4 or THERMAL_80MM)' },
    { key: 'LOW_STOCK_ALERT_THRESHOLD', value: '3', description: 'Default Low Stock Alert Threshold' },
    { key: 'AUTO_SYNC_INTERVAL_SEC', value: '30', description: 'Background Synchronization Polling Interval in Seconds' },
    { key: 'APP_VERSION', value: '1.0.0-PROD', description: 'Current Application Version' },
  ];

  for (const s of defaultSettings) {
    await prisma.applicationSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✓ Application Settings initialized');

  console.log('🎉 Seeding successfully completed for DEEP E-BIKE & TOY!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
