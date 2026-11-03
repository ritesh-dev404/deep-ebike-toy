import prisma from '../config/prisma';

export const SYSTEM_PERMISSIONS = [
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

export const DEFAULT_EMPLOYEE_PERMISSIONS = [
  'SALES_CREATE',
  'SALES_READ',
  'PRODUCTS_READ',
  'CUSTOMERS_MANAGE',
];

export const DEFAULT_APPLICATION_SETTINGS = [
  { key: 'SHOP_NAME', value: 'DEEP E-BIKE & TOY' },
  { key: 'SHOP_TAGLINE', value: 'Electric Bikes, Electric Scooters, Kids Ride-On & Toys' },
  { key: 'SHOP_ADDRESS', value: 'Shop No. 12-14, Green Park Main Road, City Center' },
  { key: 'SHOP_PHONE', value: '+91 98765 43210' },
  { key: 'SHOP_EMAIL', value: 'contact@deepebikeandtoy.com' },
  { key: 'SHOP_GSTIN', value: '27ABCDE1234F1Z5' },
  { key: 'INVOICE_PREFIX', value: 'DEB-' },
  { key: 'DEFAULT_PAYMENT_MODE', value: 'CASH' },
  { key: 'TERMS_AND_CONDITIONS', value: 'Goods once sold cannot be returned without original receipt. Warranty applicable as per manufacturer terms.' },
];

/**
 * Ensures system roles, permissions, and application settings exist in the active database.
 */
export async function ensureSystemRolesAndPermissions() {
  // 1. Ensure Roles
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

  // 2. Ensure Permissions & Role-Permission mappings
  for (const perm of SYSTEM_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module, action: perm.action },
      create: perm,
    });

    // Owner gets all permissions
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

    // Employee gets default selected permissions if not already configured
    if (DEFAULT_EMPLOYEE_PERMISSIONS.includes(perm.name)) {
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

  // 3. Ensure Default Application Settings
  for (const setting of DEFAULT_APPLICATION_SETTINGS) {
    await prisma.applicationSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  return { ownerRole, employeeRole };
}
