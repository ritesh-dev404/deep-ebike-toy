import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';
import { ExcelService } from '../services/excel.service';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { search, categoryId, lowStock, status } = req.query;
    const isOwner = req.user?.roleName === 'OWNER';

    const where: any = {};

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { productCode: { contains: q } },
        { barcode: { contains: q } },
        { brand: { contains: q } },
        { modelNumber: { contains: q } },
      ];
    }

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    let products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, code: true },
        },
        serialNumbers: {
          where: { status: 'AVAILABLE' },
          select: { id: true, serialNumber: true, chassisNumber: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (lowStock === 'true') {
      products = products.filter((p) => p.availableQuantity <= p.minStockLevel);
    }

    // Role-based security: Hide purchasePrice from employees!
    const sanitizedProducts = products.map((p) => {
      const item: any = { ...p };
      if (!isOwner) {
        delete item.purchasePrice;
      }
      return item;
    });

    return res.json({ success: true, data: sanitizedProducts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const isOwner = req.user?.roleName === 'OWNER';

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        serialNumbers: true,
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const item: any = { ...product };
    if (!isOwner) {
      delete item.purchasePrice;
    }

    return res.json({ success: true, data: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductByBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;
    const isOwner = req.user?.roleName === 'OWNER';

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ barcode: barcode.trim() }, { productCode: barcode.trim() }],
      },
      include: {
        category: true,
        serialNumbers: {
          where: { status: 'AVAILABLE' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'No product matches this barcode or SKU' });
    }

    const item: any = { ...product };
    if (!isOwner) {
      delete item.purchasePrice;
    }

    return res.json({ success: true, data: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      productCode,
      name,
      categoryId,
      brand,
      modelNumber,
      barcode,
      purchasePrice,
      sellingPrice,
      gstRate,
      availableQuantity,
      minStockLevel,
      description,
      isSerialTracked,
      serialNumbers,
    } = req.body;

    if (!name || !categoryId || sellingPrice === undefined) {
      return res.status(400).json({ success: false, message: 'Name, Category, and Selling Price are required' });
    }

    // Generate product code if not provided
    const code = productCode?.trim() || `PRD-${Date.now().toString().slice(-6)}`;

    const existingCode = await prisma.product.findUnique({ where: { productCode: code } });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Product code '${code}' is already in use` });
    }

    if (barcode?.trim()) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: barcode.trim() } });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: `Barcode '${barcode}' is already assigned to another product` });
      }
    }

    const qty = parseInt(availableQuantity || '0', 10);
    const minStock = parseInt(minStockLevel || '3', 10);

    const product = await prisma.$transaction(async (tx) => {
      const newProd = await tx.product.create({
        data: {
          productCode: code,
          name: name.trim(),
          categoryId,
          brand: brand?.trim(),
          modelNumber: modelNumber?.trim(),
          barcode: barcode?.trim() || null,
          purchasePrice: parseFloat(purchasePrice || '0'),
          sellingPrice: parseFloat(sellingPrice || '0'),
          gstRate: parseFloat(gstRate || '0'),
          availableQuantity: qty,
          minStockLevel: minStock,
          description: description?.trim(),
          isSerialTracked: !!isSerialTracked,
          status: qty <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
        },
      });

      // Initial stock movement record
      if (qty > 0) {
        await tx.stockMovement.create({
          data: {
            productId: newProd.id,
            movementType: 'ADJUSTMENT_ADD',
            quantity: qty,
            previousStock: 0,
            newStock: qty,
            notes: 'Initial opening inventory setup',
            createdById: req.user!.id,
          },
        });
      }

      // If serial numbers supplied
      if (isSerialTracked && Array.isArray(serialNumbers)) {
        for (const item of serialNumbers) {
          const sNum = typeof item === 'string' ? item : item.serialNumber;
          const cNum = typeof item === 'object' ? item.chassisNumber : null;
          if (sNum?.trim()) {
            await tx.productSerialNumber.create({
              data: {
                productId: newProd.id,
                serialNumber: sNum.trim(),
                chassisNumber: cNum?.trim() || null,
                status: 'AVAILABLE',
              },
            });
          }
        }
      }

      return newProd;
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_PRODUCT',
      entityName: 'Product',
      entityId: product.id,
      newValues: product,
      ipAddress: req.ip,
    });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error: any) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      categoryId,
      brand,
      modelNumber,
      barcode,
      purchasePrice,
      sellingPrice,
      gstRate,
      minStockLevel,
      description,
      isSerialTracked,
      status,
    } = req.body;

    const oldProduct = await prisma.product.findUnique({ where: { id } });
    if (!oldProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (barcode?.trim() && barcode.trim() !== oldProduct.barcode) {
      const existing = await prisma.product.findUnique({ where: { barcode: barcode.trim() } });
      if (existing && existing.id !== id) {
        return res.status(400).json({ success: false, message: 'Barcode is already in use by another item' });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        categoryId: categoryId || undefined,
        brand: brand !== undefined ? brand.trim() : undefined,
        modelNumber: modelNumber !== undefined ? modelNumber.trim() : undefined,
        barcode: barcode !== undefined ? barcode.trim() : undefined,
        purchasePrice: purchasePrice !== undefined ? parseFloat(purchasePrice) : undefined,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        gstRate: gstRate !== undefined ? parseFloat(gstRate) : undefined,
        minStockLevel: minStockLevel !== undefined ? parseInt(minStockLevel, 10) : undefined,
        description: description !== undefined ? description.trim() : undefined,
        isSerialTracked: isSerialTracked !== undefined ? !!isSerialTracked : undefined,
        status: status || undefined,
      },
    });

    await logAudit({
      userId: req.user?.id,
      action: 'UPDATE_PRODUCT',
      entityName: 'Product',
      entityId: id,
      oldValues: oldProduct,
      newValues: updated,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if product has sales or purchases
    const hasSales = await prisma.saleItem.count({ where: { productId: id } });
    const hasPurchases = await prisma.purchaseItem.count({ where: { productId: id } });

    if (hasSales > 0 || hasPurchases > 0) {
      // Soft deactivate instead of deleting to protect audit history
      await prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      return res.json({
        success: true,
        message: 'Product has active transaction history. It was marked INACTIVE instead of deleted.',
      });
    }

    await prisma.product.delete({ where: { id } });

    await logAudit({
      userId: req.user?.id,
      action: 'DELETE_PRODUCT',
      entityName: 'Product',
      entityId: id,
      ipAddress: req.ip,
    });

    return res.json({ success: true, message: 'Product deleted permanently' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const exportProductsExcel = async (req: Request, res: Response) => {
  try {
    const isOwner = req.user?.roleName === 'OWNER';
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const columns: any[] = [
      { header: 'Product Code', key: 'productCode', width: 16 },
      { header: 'Product Name', key: 'name', width: 35 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Brand', key: 'brand', width: 18 },
      { header: 'Model Number', key: 'modelNumber', width: 16 },
      { header: 'Barcode', key: 'barcode', width: 18 },
    ];

    if (isOwner) {
      columns.push({ header: 'Purchase Price (₹)', key: 'purchasePrice', width: 18 });
    }

    columns.push(
      { header: 'Selling Price (₹)', key: 'sellingPrice', width: 18 },
      { header: 'GST Rate (%)', key: 'gstRate', width: 14 },
      { header: 'Stock Qty', key: 'availableQuantity', width: 14 },
      { header: 'Min Stock Level', key: 'minStockLevel', width: 16 },
      { header: 'Serial Tracked', key: 'isSerialTracked', width: 15 },
      { header: 'Status', key: 'status', width: 14 }
    );

    const rows = products.map((p) => ({
      productCode: p.productCode,
      name: p.name,
      category: p.category.name,
      brand: p.brand || '-',
      modelNumber: p.modelNumber || '-',
      barcode: p.barcode || '-',
      purchasePrice: isOwner ? p.purchasePrice : undefined,
      sellingPrice: p.sellingPrice,
      gstRate: `${p.gstRate}%`,
      availableQuantity: p.availableQuantity,
      minStockLevel: p.minStockLevel,
      isSerialTracked: p.isSerialTracked ? 'YES' : 'NO',
      status: p.status,
    }));

    await ExcelService.exportToStream(
      res,
      'Products Inventory',
      columns,
      rows,
      `DEEP_EBIKE_PRODUCTS_${Date.now()}.xlsx`
    );
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
