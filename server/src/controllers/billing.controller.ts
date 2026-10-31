import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { BillingService } from '../services/billing.service';
import { PdfService } from '../services/pdf.service';
import { logAudit } from '../services/audit.service';

export const createBill = async (req: Request, res: Response) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discountAmount,
      paymentMethod,
      amountReceived,
      notes,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must have at least one product line' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: 'Payment method is required' });
    }

    const sale = await BillingService.createSale({
      customerId,
      customerName,
      customerPhone,
      items,
      discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
      paymentMethod,
      amountReceived: amountReceived ? parseFloat(amountReceived) : 0,
      notes,
      createdById: req.user!.id,
    });

    await logAudit({
      userId: req.user?.id,
      action: 'CREATE_SALE',
      entityName: 'Sale',
      entityId: sale.id,
      newValues: {
        invoiceNumber: sale.invoiceNumber,
        grandTotal: sale.grandTotal,
      },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: sale,
    });
  } catch (error: any) {
    console.error('Error generating bill:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate bill',
    });
  }
};

export const getAllBills = async (req: Request, res: Response) => {
  try {
    const { search, status, paymentMethod, startDate, endDate, employeeId } = req.query;
    const isOwner = req.user?.roleName === 'OWNER';

    const where: any = {};

    // If employee, they can only view their permitted sales unless owner
    if (!isOwner && employeeId && employeeId !== req.user?.id) {
      where.createdById = req.user?.id;
    } else if (employeeId && typeof employeeId === 'string') {
      where.createdById = employeeId;
    }

    if (search && typeof search === 'string') {
      const q = search.trim();
      where.OR = [
        { invoiceNumber: { contains: q } },
        { customerName: { contains: q } },
        { customerPhone: { contains: q } },
      ];
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    }

    if (paymentMethod && typeof paymentMethod === 'string' && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

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
        customer: { select: { id: true, name: true, phone: true } },
        createdBy: { select: { id: true, fullName: true, username: true } },
        _count: { select: { items: true } },
      },
      orderBy: { saleDate: 'desc' },
      take: 200,
    });

    return res.json({ success: true, data: sales });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBillById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, fullName: true, username: true } },
        items: {
          include: {
            product: { select: { id: true, productCode: true, name: true, barcode: true } },
          },
        },
        payments: true,
        serialNumbers: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.json({ success: true, data: sale });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const updatedSale = await BillingService.cancelSale(id, reason.trim(), req.user!.id);

    await logAudit({
      userId: req.user?.id,
      action: 'CANCEL_SALE',
      entityName: 'Sale',
      entityId: id,
      newValues: { reason, status: 'CANCELLED' },
      ipAddress: req.ip,
    });

    return res.json({
      success: true,
      message: 'Invoice cancelled successfully and inventory restored',
      data: updatedSale,
    });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const printInvoicePdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { fullName: true } },
        items: true,
      },
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoiceData = {
      invoiceNumber: sale.invoiceNumber,
      saleDate: sale.saleDate,
      customerName: sale.customer?.name || sale.customerName || 'Walk-in Customer',
      customerPhone: sale.customer?.phone || sale.customerPhone || 'N/A',
      paymentMethod: sale.paymentMethod,
      items: sale.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        gstRate: i.gstRate,
        taxAmount: i.taxAmount,
        totalPrice: i.totalPrice,
        serialNumbers: i.serialNumbersJson ? JSON.parse(i.serialNumbersJson) : [],
      })),
      subtotal: sale.subtotal,
      taxAmount: sale.taxAmount,
      discountAmount: sale.discountAmount,
      grandTotal: sale.grandTotal,
      amountReceived: sale.amountReceived,
      changeAmount: sale.changeAmount,
      cashierName: sale.createdBy.fullName,
    };

    PdfService.generateA4Invoice(res, invoiceData);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
