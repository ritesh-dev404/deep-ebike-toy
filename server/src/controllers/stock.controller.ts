import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getStockOverview = async (req: Request, res: Response) => {
  try {
    const isOwner = req.user?.roleName === 'OWNER';

    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
    });

    let totalProducts = products.length;
    let totalStockUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockValue = 0;

    for (const p of products) {
      totalStockUnits += p.availableQuantity;
      if (p.availableQuantity <= 0) {
        outOfStockCount++;
      } else if (p.availableQuantity <= p.minStockLevel) {
        lowStockCount++;
      }

      if (isOwner) {
        totalStockValue += p.availableQuantity * p.purchasePrice;
      }
    }

    // Movements breakdown
    const movementsAgg = await prisma.stockMovement.groupBy({
      by: ['movementType'],
      _sum: {
        quantity: true,
      },
    });

    const movementsMap: Record<string, number> = {};
    movementsAgg.forEach((m) => {
      movementsMap[m.movementType] = m._sum.quantity || 0;
    });

    return res.json({
      success: true,
      data: {
        totalProducts,
        totalStockUnits,
        lowStockCount,
        outOfStockCount,
        totalStockValue: isOwner ? Math.round(totalStockValue * 100) / 100 : undefined,
        stockInTotal: movementsMap['PURCHASE'] || 0,
        stockSoldTotal: Math.abs(movementsMap['SALE'] || 0),
        stockReturnedTotal: movementsMap['RETURN'] || 0,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getStockMovements = async (req: Request, res: Response) => {
  try {
    const { productId, movementType, limit } = req.query;
    const where: any = {};

    if (productId && typeof productId === 'string') {
      where.productId = productId;
    }

    if (movementType && typeof movementType === 'string' && movementType !== 'ALL') {
      where.movementType = movementType;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, productCode: true, barcode: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit ? parseInt(limit as string, 10) : 100,
    });

    return res.json({ success: true, data: movements });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { productId, adjustmentType, quantity, notes } = req.body;

    if (!productId || !adjustmentType || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, Adjustment Type (ADD or SUBTRACT), and Quantity are required',
      });
    }

    const qty = Math.abs(parseInt(quantity, 10));
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.availableQuantity;
    let newStock = previousStock;
    let moveType = 'ADJUSTMENT_ADD';
    let movementQty = qty;

    if (adjustmentType === 'SUBTRACT') {
      if (previousStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Cannot deduct ${qty} units. Current stock is only ${previousStock}. Negative stock is prohibited.`,
        });
      }
      newStock = previousStock - qty;
      moveType = 'ADJUSTMENT_SUB';
      movementQty = -qty;
    } else {
      newStock = previousStock + qty;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedProd = await tx.product.update({
        where: { id: productId },
        data: {
          availableQuantity: newStock,
          status: newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
        },
      });

      await tx.stockMovement.create({
        data: {
          productId,
          movementType: moveType,
          quantity: movementQty,
          previousStock,
          newStock,
          notes: notes?.trim() || `Manual stock adjustment (${adjustmentType})`,
          createdById: req.user!.id,
        },
      });

      return updatedProd;
    });

    await logAudit({
      userId: req.user?.id,
      action: 'STOCK_ADJUSTMENT',
      entityName: 'Product',
      entityId: productId,
      oldValues: { availableQuantity: previousStock },
      newValues: { availableQuantity: newStock, reason: notes },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: `Stock updated successfully. New stock: ${newStock}`,
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSerialNumbers = async (req: Request, res: Response) => {
  try {
    const { productId, status, search } = req.query;
    const where: any = {};

    if (productId && typeof productId === 'string') {
      where.productId = productId;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { serialNumber: { contains: q } },
        { chassisNumber: { contains: q } },
      ];
    }

    const serials = await prisma.productSerialNumber.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, productCode: true } },
        sale: { select: { id: true, invoiceNumber: true, saleDate: true } },
        purchase: { select: { id: true, invoiceNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return res.json({ success: true, data: serials });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
