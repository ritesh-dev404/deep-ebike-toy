import prisma from '../config/prisma';

export interface CreateSaleItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number; // Override if allowed, otherwise defaults to product.sellingPrice
  discount?: number;
  serialNumbers?: string[];
}

export interface CreateSaleInput {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: CreateSaleItemInput[];
  discountAmount?: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER' | 'SPLIT';
  amountReceived: number;
  notes?: string;
  createdById: string;
}

export class BillingService {
  /**
   * Generates next sequential invoice number e.g. INV-2026-0003
   */
  static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastSale = await prisma.sale.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });

    let nextSeq = 1;
    if (lastSale?.invoiceNumber) {
      const parts = lastSale.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextSeq = lastNum + 1;
      }
    }

    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Atomic Transaction for creating a sale
   */
  static async createSale(input: CreateSaleInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error('Sale must contain at least one item');
    }

    // Run inside database transaction to guarantee stock consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Validate customer & optionally upsert
      let customerId = input.customerId;
      if (!customerId && input.customerPhone?.trim()) {
        const phone = input.customerPhone.trim();
        const existingCust = await tx.customer.findUnique({ where: { phone } });
        if (existingCust) {
          customerId = existingCust.id;
        } else {
          const newCust = await tx.customer.create({
            data: {
              name: input.customerName?.trim() || 'Retail Customer',
              phone,
            },
          });
          customerId = newCust.id;
        }
      }

      // 2. Validate products and stock
      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      const preparedItems: any[] = [];
      const stockMovementRecords: any[] = [];
      const serialUpdates: Array<{ id: string; serialNumber: string }> = [];

      for (const item of input.items) {
        if (item.quantity <= 0) {
          throw new Error('Quantity must be greater than zero');
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            serialNumbers: {
              where: { status: 'AVAILABLE' },
            },
          },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        // NO NEGATIVE STOCK ALLOWED!
        if (product.availableQuantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.availableQuantity}, Requested: ${item.quantity}`
          );
        }

        // Validate serials if product is serial-tracked
        if (product.isSerialTracked) {
          if (!item.serialNumbers || item.serialNumbers.length !== item.quantity) {
            throw new Error(
              `Product "${product.name}" requires exactly ${item.quantity} serial/chassis number(s). Provided: ${item.serialNumbers?.length || 0}`
            );
          }

          const availableSerials = new Set(product.serialNumbers.map((s) => s.serialNumber));
          for (const sNum of item.serialNumbers) {
            if (!availableSerials.has(sNum)) {
              throw new Error(`Serial/Chassis number "${sNum}" is not available in inventory`);
            }
            const foundObj = product.serialNumbers.find((s) => s.serialNumber === sNum);
            if (foundObj) {
              serialUpdates.push({ id: foundObj.id, serialNumber: sNum });
            }
          }
        }

        const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.sellingPrice;
        const discount = item.discount || 0;
        const lineItemNet = unitPrice * item.quantity - discount;
        const lineTax = (lineItemNet * product.gstRate) / (100 + product.gstRate); // Inclusive tax calculation
        const lineSubtotal = lineItemNet - lineTax;

        calculatedSubtotal += lineSubtotal;
        calculatedTax += lineTax;

        preparedItems.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice,
          costPrice: product.purchasePrice, // Storing historical cost price!
          discount,
          gstRate: product.gstRate,
          taxAmount: Math.round(lineTax * 100) / 100,
          totalPrice: lineItemNet,
          serialNumbersJson: item.serialNumbers ? JSON.stringify(item.serialNumbers) : null,
        });

        // Decrement Product Stock
        const newStock = product.availableQuantity - item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: {
            availableQuantity: newStock,
            status: newStock <= 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
          },
        });

        stockMovementRecords.push({
          productId: product.id,
          movementType: 'SALE',
          quantity: -item.quantity,
          previousStock: product.availableQuantity,
          newStock,
          notes: 'Deducted on POS Sale',
        });
      }

      const overallDiscount = input.discountAmount || 0;
      const grandTotal = Math.round((calculatedSubtotal + calculatedTax - overallDiscount) * 100) / 100;
      const changeAmount = Math.max(0, input.amountReceived - grandTotal);
      const invoiceNumber = await BillingService.generateInvoiceNumber();

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId,
          customerName: input.customerName || (customerId ? undefined : 'Walk-in Customer'),
          customerPhone: input.customerPhone,
          subtotal: Math.round(calculatedSubtotal * 100) / 100,
          taxAmount: Math.round(calculatedTax * 100) / 100,
          discountAmount: overallDiscount,
          grandTotal,
          paymentMethod: input.paymentMethod,
          paymentStatus: 'PAID',
          amountReceived: input.amountReceived,
          changeAmount,
          status: 'COMPLETED',
          notes: input.notes,
          createdById: input.createdById,
          isSynced: false,
          items: {
            create: preparedItems,
          },
          payments: {
            create: [
              {
                referenceType: 'SALE',
                amount: grandTotal,
                paymentMethod: input.paymentMethod,
                createdById: input.createdById,
              },
            ],
          },
        },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { fullName: true } },
        },
      });

      // 4. Update Serial Numbers to SOLD
      for (const s of serialUpdates) {
        await tx.productSerialNumber.update({
          where: { id: s.id },
          data: {
            status: 'SOLD',
            saleId: sale.id,
          },
        });
      }

      // 5. Create Stock Movement records
      for (const sm of stockMovementRecords) {
        await tx.stockMovement.create({
          data: {
            ...sm,
            referenceId: sale.id,
            referenceType: 'SALE',
            createdById: input.createdById,
          },
        });
      }

      // 6. Update Customer stats
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            totalPurchases: { increment: grandTotal },
            lastPurchaseDate: new Date(),
          },
        });
      }

      // 7. Push to Sync Queue for cloud background sync
      await tx.syncQueue.create({
        data: {
          entityName: 'Sale',
          entityId: sale.id,
          action: 'CREATE',
          payload: JSON.stringify({
            invoiceNumber: sale.invoiceNumber,
            grandTotal: sale.grandTotal,
            saleDate: sale.saleDate,
            itemsCount: preparedItems.length,
          }),
          status: 'PENDING',
        },
      });

      return sale;
    });
  }

  /**
   * Cancel an existing completed sale and restore stock
   */
  static async cancelSale(saleId: string, reason: string, cancelledById: string) {
    return await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: {
          items: true,
          serialNumbers: true,
        },
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      if (sale.status === 'CANCELLED') {
        throw new Error('This invoice is already cancelled');
      }

      // 1. Restore Stock for each product
      for (const item of sale.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) {
          const restoredStock = prod.availableQuantity + item.quantity;
          await tx.product.update({
            where: { id: prod.id },
            data: {
              availableQuantity: restoredStock,
              status: 'ACTIVE',
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: prod.id,
              movementType: 'RETURN',
              quantity: item.quantity,
              previousStock: prod.availableQuantity,
              newStock: restoredStock,
              referenceId: sale.id,
              referenceType: 'RETURN',
              notes: `Stock restored from cancelled invoice ${sale.invoiceNumber}. Reason: ${reason}`,
              createdById: cancelledById,
            },
          });
        }
      }

      // 2. Restore serial numbers to AVAILABLE
      for (const s of sale.serialNumbers) {
        await tx.productSerialNumber.update({
          where: { id: s.id },
          data: {
            status: 'AVAILABLE',
            saleId: null,
            notes: `Restored on sale cancellation: ${reason}`,
          },
        });
      }

      // 3. Mark Sale status as CANCELLED (never delete)
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          status: 'CANCELLED',
          notes: sale.notes ? `${sale.notes} | CANCELLED: ${reason}` : `CANCELLED: ${reason}`,
        },
      });

      // 4. Update Customer totalPurchases
      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: {
            totalPurchases: { decrement: sale.grandTotal },
          },
        });
      }

      // 5. Enqueue cancellation to SyncQueue
      await tx.syncQueue.create({
        data: {
          entityName: 'Sale',
          entityId: sale.id,
          action: 'UPDATE',
          payload: JSON.stringify({
            status: 'CANCELLED',
            reason,
          }),
          status: 'PENDING',
        },
      });

      return updatedSale;
    });
  }
}
