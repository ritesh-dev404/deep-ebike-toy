import prisma from '../config/prisma';

export interface CreateSaleItemInput {
  productId?: string;
  productName?: string;
  quantity?: number; // Defaults to 1
  unitPrice: number;
  hsnCode?: string;
  gstRate?: number;
  discount?: number;
  serialNumbers?: string[];
}

export interface CreateSaleInput {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: CreateSaleItemInput[];
  discountAmount?: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER' | 'SPLIT';
  amountReceived?: number;
  notes?: string;
  createdById: string;
}

export class BillingService {
  /**
   * Generates next sequential invoice number e.g. INV-2026-0004
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
      // 1. Optional Customer Upsert / Lookup
      let customerId = input.customerId;
      if (!customerId && input.customerPhone?.trim()) {
        const phone = input.customerPhone.trim();
        const existingCust = await tx.customer.findUnique({ where: { phone } });
        if (existingCust) {
          customerId = existingCust.id;
          if (input.customerAddress?.trim() && !existingCust.address) {
            await tx.customer.update({
              where: { id: customerId },
              data: { address: input.customerAddress.trim() },
            });
          }
        } else {
          const newCust = await tx.customer.create({
            data: {
              name: input.customerName?.trim() || 'Retail Customer',
              phone,
              address: input.customerAddress?.trim() || null,
            },
          });
          customerId = newCust.id;
        }
      }

      // 2. Validate products and calculate amounts
      let calculatedSubtotal = 0;
      let calculatedTax = 0;
      const preparedItems: any[] = [];
      const stockMovementRecords: any[] = [];
      const serialUpdates: Array<{ id: string; serialNumber: string }> = [];

      // Ensure default fallback category exists
      let defaultCat = await tx.category.findFirst();
      if (!defaultCat) {
        defaultCat = await tx.category.create({
          data: {
            name: 'Electric Vehicles & Toys',
            code: 'GENERAL',
            description: 'General Products',
          },
        });
      }

      for (const item of input.items) {
        const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
        const unitPrice = parseFloat(String(item.unitPrice || 0));

        if (unitPrice < 0) {
          throw new Error('Unit price cannot be negative');
        }

        let product: any = null;

        // Try finding product by ID or Name
        if (item.productId) {
          product = await tx.product.findUnique({
            where: { id: item.productId },
            include: {
              serialNumbers: { where: { status: 'AVAILABLE' } },
            },
          });
        } else if (item.productName?.trim()) {
          product = await tx.product.findFirst({
            where: { name: item.productName.trim() },
            include: {
              serialNumbers: { where: { status: 'AVAILABLE' } },
            },
          });
        }

        // Auto-create product if employee entered an ad-hoc or newly stocked product!
        if (!product) {
          const prodName = item.productName?.trim() || 'Custom Retail Item';
          const sku = `PRD-${Date.now().toString().slice(-6)}`;
          product = await tx.product.create({
            data: {
              productCode: sku,
              name: prodName,
              categoryId: defaultCat.id,
              sellingPrice: unitPrice,
              purchasePrice: Math.round(unitPrice * 0.7), // Estimated cost if not specified
              gstRate: item.gstRate !== undefined ? item.gstRate : 5.0,
              availableQuantity: 999, // Open stock so billing never fails
              minStockLevel: 2,
              status: 'ACTIVE',
            },
            include: { serialNumbers: true },
          });
        }

        // Validate serials if product is serial-tracked
        if (product.isSerialTracked && item.serialNumbers && item.serialNumbers.length > 0) {
          const availableSerials = new Set(product.serialNumbers.map((s: any) => s.serialNumber));
          for (const sNum of item.serialNumbers) {
            if (availableSerials.has(sNum)) {
              const foundObj = product.serialNumbers.find((s: any) => s.serialNumber === sNum);
              if (foundObj) {
                serialUpdates.push({ id: foundObj.id, serialNumber: sNum });
              }
            }
          }
        }

        const effectiveGstRate = item.gstRate !== undefined ? item.gstRate : product.gstRate;
        const discount = item.discount || 0;
        const lineItemNet = unitPrice * qty - discount;
        const lineTax = (lineItemNet * effectiveGstRate) / (100 + effectiveGstRate); // Inclusive tax calculation
        const lineTaxableSubtotal = lineItemNet - lineTax;

        calculatedSubtotal += lineTaxableSubtotal;
        calculatedTax += lineTax;

        // Auto-assign HSN code based on category / product
        let hsn = item.hsnCode || product.hsnCode || '8711';
        if (product.name.toLowerCase().includes('toy') || product.name.toLowerCase().includes('drone')) {
          hsn = '9503';
        } else if (product.name.toLowerCase().includes('battery')) {
          hsn = '8507';
        }

        preparedItems.push({
          productId: product.id,
          productName: product.name,
          hsnCode: hsn,
          quantity: qty,
          unitPrice,
          costPrice: product.purchasePrice || Math.round(unitPrice * 0.7),
          discount,
          gstRate: effectiveGstRate,
          taxAmount: Math.round(lineTax * 100) / 100,
          totalPrice: lineItemNet,
          serialNumbersJson: item.serialNumbers ? JSON.stringify(item.serialNumbers) : null,
        });

        // Decrement Product Stock safely
        const newStock = Math.max(0, product.availableQuantity - qty);
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
          quantity: -qty,
          previousStock: product.availableQuantity,
          newStock,
          notes: 'Deducted on POS Sale',
        });
      }

      const overallDiscount = input.discountAmount || 0;
      const grandTotal = Math.round((calculatedSubtotal + calculatedTax - overallDiscount) * 100) / 100;
      const amountRcvd = input.amountReceived !== undefined ? input.amountReceived : grandTotal;
      const changeAmount = Math.max(0, amountRcvd - grandTotal);
      const invoiceNumber = await BillingService.generateInvoiceNumber();

      // 3. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId,
          customerName: input.customerName?.trim() || (customerId ? undefined : 'Walk-in Customer'),
          customerPhone: input.customerPhone?.trim() || undefined,
          subtotal: Math.round(calculatedSubtotal * 100) / 100,
          taxAmount: Math.round(calculatedTax * 100) / 100,
          discountAmount: overallDiscount,
          grandTotal,
          paymentMethod: input.paymentMethod || 'CASH',
          paymentStatus: 'PAID',
          amountReceived: amountRcvd,
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
                paymentMethod: input.paymentMethod || 'CASH',
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
