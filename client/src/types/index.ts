export type RoleName = 'OWNER' | 'EMPLOYEE';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  role: RoleName;
  permissions: string[];
}

export interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  _count?: { products: number };
}

export interface SerialNumber {
  id: string;
  productId: string;
  serialNumber: string;
  chassisNumber?: string;
  status: 'AVAILABLE' | 'SOLD' | 'RETURNED' | 'DEFECTIVE';
  notes?: string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  categoryId: string;
  category?: Category;
  brand?: string;
  modelNumber?: string;
  barcode?: string;
  purchasePrice?: number; // Only for owner
  sellingPrice: number;
  gstRate: number;
  availableQuantity: number;
  minStockLevel: number;
  imageUrl?: string;
  description?: string;
  hsnCode?: string;
  isSerialTracked: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  serialNumbers?: SerialNumber[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
  _count?: { sales: number };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  outstandingBalance: number;
  status: string;
  _count?: { purchases: number };
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  selectedSerials: string[];
  totalPrice: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  discount: number;
  gstRate: number;
  taxAmount: number;
  totalPrice: number;
  hsnCode?: string;
  serialNumbersJson?: string;
  product?: Product;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  customerName?: string;
  customerPhone?: string;
  saleDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER' | 'SPLIT';
  paymentStatus: string;
  amountReceived: number;
  changeAmount: number;
  status: 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdById: string;
  createdBy?: { fullName: string; username: string };
  isSynced: boolean;
  items?: SaleItem[];
}

export interface PurchaseItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPurchasePrice: number;
  gstRate: number;
  taxAmount: number;
  totalPrice: number;
  hsnCode?: string;
  serialNumbersJson?: string;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplier?: Supplier;
  purchaseDate: string;
  totalAmount: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: string;
  notes?: string;
  createdBy?: { fullName: string };
  items?: PurchaseItem[];
}

export interface StockMovement {
  id: string;
  productId: string;
  product: { id: string; name: string; productCode: string; barcode?: string };
  movementType: 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT_ADD' | 'ADJUSTMENT_SUB';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  createdAt: string;
  createdBy: { id: string; fullName: string };
}

export interface DashboardSummary {
  todaySales: number;
  todayBillsCount: number;
  monthlySales: number;
  monthlyBillsCount: number;
  totalRevenue: number;
  estimatedGrossProfit?: number;
  totalProducts: number;
  totalStockUnits: number;
  totalStockValue?: number;
  lowStockCount: number;
  lowStockProducts: any[];
  totalEmployees: number;
  recentTransactions: Sale[];
  topSellingProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  monthlyPurchasesTotal?: number;
  totalSupplierPayable?: number;
}
