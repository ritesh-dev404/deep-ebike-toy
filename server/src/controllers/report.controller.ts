import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { ExcelService } from '../services/excel.service';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const isOwner = req.user?.roleName === 'OWNER';

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Sales Aggregations
    const allCompletedSales = await prisma.sale.findMany({
      where: { status: 'COMPLETED' },
      include: {
        items: true,
      },
    });

    let todaySales = 0;
    let todayBillsCount = 0;
    let monthlySales = 0;
    let monthlyBillsCount = 0;
    let totalRevenue = 0;
    let totalGrossProfit = 0;

    for (const sale of allCompletedSales) {
      const saleDate = new Date(sale.saleDate);
      totalRevenue += sale.grandTotal;

      if (saleDate >= startOfToday) {
        todaySales += sale.grandTotal;
        todayBillsCount++;
      }

      if (saleDate >= startOfMonth) {
        monthlySales += sale.grandTotal;
        monthlyBillsCount++;
      }

      // Calculate gross profit for owner:
      if (isOwner) {
        for (const item of sale.items) {
          const itemRevenue = item.unitPrice * item.quantity - item.discount;
          const itemCost = item.costPrice * item.quantity;
          totalGrossProfit += itemRevenue - itemCost;
        }
      }
    }

    // Products & Stock summary
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
    });

    let totalProducts = products.length;
    let totalStockUnits = 0;
    let totalStockValue = 0;
    const lowStockProducts: any[] = [];

    for (const p of products) {
      totalStockUnits += p.availableQuantity;
      if (isOwner) {
        totalStockValue += p.availableQuantity * p.purchasePrice;
      }
      if (p.availableQuantity <= p.minStockLevel) {
        lowStockProducts.push({
          id: p.id,
          name: p.name,
          productCode: p.productCode,
          category: p.category.name,
          availableQuantity: p.availableQuantity,
          minStockLevel: p.minStockLevel,
          status: p.status,
        });
      }
    }

    // Employees count
    const totalEmployees = await prisma.user.count({ where: { isActive: true } });

    // Recent 10 Transactions
    const recentTransactions = await prisma.sale.findMany({
      take: 10,
      orderBy: { saleDate: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        createdBy: { select: { fullName: true } },
      },
    });

    // Top Selling Products
    const topSaleItems = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      where: {
        sale: { status: 'COMPLETED' },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topSellingProducts = topSaleItems.map((item) => ({
      productId: item.productId,
      name: item.productName,
      totalSold: item._sum.quantity || 0,
      totalRevenue: Math.round((item._sum.totalPrice || 0) * 100) / 100,
    }));

    // Purchases summary for owner
    let monthlyPurchasesTotal = 0;
    let totalSupplierPayable = 0;

    if (isOwner) {
      const purchasesThisMonth = await prisma.purchase.findMany({
        where: { purchaseDate: { gte: startOfMonth } },
      });
      monthlyPurchasesTotal = purchasesThisMonth.reduce((acc, p) => acc + p.grandTotal, 0);

      const suppliers = await prisma.supplier.findMany();
      totalSupplierPayable = suppliers.reduce((acc, s) => acc + s.outstandingBalance, 0);
    }

    return res.json({
      success: true,
      data: {
        todaySales: Math.round(todaySales * 100) / 100,
        todayBillsCount,
        monthlySales: Math.round(monthlySales * 100) / 100,
        monthlyBillsCount,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        estimatedGrossProfit: isOwner ? Math.round(totalGrossProfit * 100) / 100 : undefined,
        totalProducts,
        totalStockUnits,
        totalStockValue: isOwner ? Math.round(totalStockValue * 100) / 100 : undefined,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        totalEmployees,
        recentTransactions,
        topSellingProducts,
        monthlyPurchasesTotal: isOwner ? Math.round(monthlyPurchasesTotal * 100) / 100 : undefined,
        totalSupplierPayable: isOwner ? Math.round(totalSupplierPayable * 100) / 100 : undefined,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSalesChartData = async (req: Request, res: Response) => {
  try {
    const { range = '30d' } = req.query;

    const days = range === '7d' ? 7 : range === '14d' ? 14 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        saleDate: { gte: startDate },
        status: 'COMPLETED',
      },
      include: { items: true },
      orderBy: { saleDate: 'asc' },
    });

    // Group by Day (YYYY-MM-DD)
    const dailyMap = new Map<string, { date: string; revenue: number; bills: number; profit: number }>();

    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { date: key, revenue: 0, bills: 0, profit: 0 });
    }

    for (const sale of sales) {
      const key = new Date(sale.saleDate).toISOString().split('T')[0];
      const entry = dailyMap.get(key) || { date: key, revenue: 0, bills: 0, profit: 0 };
      entry.revenue += sale.grandTotal;
      entry.bills += 1;

      for (const item of sale.items) {
        const itemRevenue = item.unitPrice * item.quantity - item.discount;
        const itemCost = item.costPrice * item.quantity;
        entry.profit += itemRevenue - itemCost;
      }
      dailyMap.set(key, entry);
    }

    const dailyChart = Array.from(dailyMap.values()).map((e) => ({
      date: e.date,
      formattedDate: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(e.revenue),
      bills: e.bills,
      profit: Math.round(e.profit),
    }));

    // Payment methods breakdown
    const paymentMethods = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      _sum: { grandTotal: true },
      _count: { id: true },
      where: { status: 'COMPLETED' },
    });

    const paymentChart = paymentMethods.map((pm) => ({
      name: pm.paymentMethod,
      value: Math.round(pm._sum.grandTotal || 0),
      count: pm._count.id,
    }));

    // Category sales distribution
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: {
            saleItems: {
              where: { sale: { status: 'COMPLETED' } },
            },
          },
        },
      },
    });

    const categoryChart = categories.map((cat) => {
      let revenue = 0;
      let units = 0;
      cat.products.forEach((prod) => {
        prod.saleItems.forEach((si) => {
          revenue += si.totalPrice;
          units += si.quantity;
        });
      });
      return {
        name: cat.name,
        code: cat.code,
        revenue: Math.round(revenue),
        units,
      };
    }).filter((c) => c.revenue > 0);

    return res.json({
      success: true,
      data: {
        dailyChart,
        paymentChart,
        categoryChart,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const exportSalesReportExcel = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const where: any = {};

    if (startDate || endDate) {
      where.saleDate = {};
      if (startDate) where.saleDate.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        where.saleDate.lte = end;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
      },
      orderBy: { saleDate: 'desc' },
    });

    const columns = [
      { header: 'Invoice #', key: 'invoiceNumber', width: 18 },
      { header: 'Date & Time', key: 'date', width: 22 },
      { header: 'Customer Name', key: 'customer', width: 25 },
      { header: 'Customer Phone', key: 'phone', width: 16 },
      { header: 'Payment Method', key: 'paymentMethod', width: 16 },
      { header: 'Subtotal (₹)', key: 'subtotal', width: 16 },
      { header: 'Tax GST (₹)', key: 'tax', width: 14 },
      { header: 'Discount (₹)', key: 'discount', width: 14 },
      { header: 'Grand Total (₹)', key: 'grandTotal', width: 18 },
      { header: 'Cashier', key: 'cashier', width: 22 },
      { header: 'Status', key: 'status', width: 14 },
    ];

    const rows = sales.map((s) => ({
      invoiceNumber: s.invoiceNumber,
      date: new Date(s.saleDate).toLocaleString(),
      customer: s.customer?.name || s.customerName || 'Walk-in Customer',
      phone: s.customer?.phone || s.customerPhone || '-',
      paymentMethod: s.paymentMethod,
      subtotal: s.subtotal,
      tax: s.taxAmount,
      discount: s.discountAmount,
      grandTotal: s.grandTotal,
      cashier: s.createdBy.fullName,
      status: s.status,
    }));

    await ExcelService.exportToStream(
      res,
      'Sales Report',
      columns,
      rows,
      `DEEP_EBIKE_SALES_REPORT_${Date.now()}.xlsx`
    );
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
