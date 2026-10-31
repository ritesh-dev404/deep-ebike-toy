import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { logAudit } from '../services/audit.service';

export const getAllPurchases = async (req: Request, res: Response) => {
  try {
    const { supplierId, search } = req.query;
    const where: any = {};

    if (supplierId && typeof supplierId === 'string' && supplierId !== 'ALL') {
      where.supplierId = supplierId;
    }

    if (search && typeof search === 'string') {
      where.invoiceNumber = { contains: search.trim() };
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, fullName: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, productCode: true } },
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return res.json({ success: true, data: purchases });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPurchaseById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { id: true, fullName: true } },
        items: {
          include: { product: true },
        },
        serialNumbers: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    return res.json({ success: true, data: purchase });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createPurchase = async (req: Request, res: Response) => {
  try {
    const {
      invoiceNumber,
      supplierId,
      purchaseDate,
      items,
      notes,
      paidAmount,
      paymentStatus,
    } = req.body;

    if (!invoiceNumber || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number, Supplier, and at least one item are required',
      });
    }

    const existingInvoice = await prisma.purchase.findUnique({
      where: { invoiceNumber: invoiceNumber.trim() },
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: `Purchase invoice number '${invoiceNumber}' has already been recorded`,
      });
    }

    // Atomic transaction to record purchase and increase stock
    const purchase = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      let totalTax = 0;
      const preparedItems: any[] = [];
      const serialCreations: any[] = [];
      const stockMovements: any[] = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        const unitCost = parseFloat(item.unitPurchasePrice);
        const gstRate = parseFloat(item.gstRate || '0');

        if (qty <= 0 || unitCost < 0) {
          throw new Error('Valid quantity and purchase price required for each item');
        }

        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        const lineTotal = qty * unitCost;
        const lineTax = (lineTotal * gstRate) / 100;

        totalAmount += lineTotal;
        totalTax += lineTax;

        preparedItems.push({
          productId: product.id,
          quantity: qty,
          unitPurchasePrice: unitCost,
          gstRate,
          taxAmount: Math.round(lineTax * 100) / 100,
          totalPrice: lineTotal + lineTax,
          serialNumbersJson: item.serialNumbers ? JSON.stringify(item.serialNumbers) : null,
        });

        // Increase product stock & update latest purchase price
        const previousStock = product.availableQuantity;
        const newStock = previousStock + qty;

        await tx.product.update({
          where: { id: product.id },
          data: {
            availableQuantity: newStock,
            purchasePrice: unitCost, // Update latest purchase cost
            status: 'ACTIVE',
          },
        });

        stockMovements.push({
          productId: product.id,
          movementType: 'PURCHASE',
          quantity: qty,
          previousStock,
          newStock,
          notes: `Stock In from Supplier Purchase Inv #${invoiceNumber}`,
        });

        // Create serial numbers if serial-tracked
        if (product.isSerialTracked && Array.isArray(item.serialNumbers)) {
          for (const s of item.serialNumbers) {
            const sNum = typeof s === 'string' ? s : s.serialNumber;
            const cNum = typeof s === 'object' ? s.chassisNumber : null;
            if (sNum?.trim()) {
              serialCreations.push({
                productId: product.id,
                serialNumber: sNum.trim(),
                chassisNumber: cNum?.trim() || null,
                status: 'AVAILABLE',
                notes: `Received on Inv #${invoiceNumber}`,
              });
            }
          }
        }
      }

      const grandTotal = Math.round((totalAmount + totalTax) * 100) / 100;
      const actualPaid = paidAmount !== undefined ? parseFloat(paidAmount) : grandTotal;
      const status = paymentStatus || (actualPaid >= grandTotal ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID');

      const createdPurchase = await tx.purchase.create({
        data: {
          invoiceNumber: invoiceNumber.trim(),
          supplierId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          totalAmount: Math.round(totalAmount * 100) / 100,
          taxAmount: Math.round(totalTax * 100) / 100,
          grandTotal,
          paidAmount: actualPaid,
          paymentStatus: status,
          notes: notes?.trim(),
          createdById: req.user!.id,
          items: {
            create: preparedItems,
          },
        },
        include: { items: true },
      });

      // Stock movements
      for (const sm of stockMovements) {
        await tx.stockMovement.create({
          data: {
            ...sm,
            referenceId: createdPurchase.id,
            referenceType: 'PURCHASE',
            createdById: req.user!.id,
          },
        });
      }

      // Serial numbers
      for (const sc of serialCreations) {
        await tx.productSerialNumber.create({
          data: {
            ...sc,
            purchaseId: createdPurchase.id,
          },
        });
      }

      // Update supplier balance if any outstanding amount
      const remaining = grandTotal - actualPaid;
      if (remaining > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            outstandingBalance: { increment: remaining },
          },
        });
      }

      return createdPurchase;
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_PURCHASE',
      entityName: 'Purchase',
      entityId: purchase.id,
      newValues: {
        invoiceNumber: purchase.invoiceNumber,
        grandTotal: purchase.grandTotal,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Purchase recorded and stock added successfully',
      data: purchase,
    });
  } catch (error: any) {
    console.error('Purchase error:', error);
    return res.status(400).json({ success: false, message: error.message || 'Failed to create purchase' });
  }
};
