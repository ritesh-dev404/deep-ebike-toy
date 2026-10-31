import PDFDocument from 'pdfkit';
import { Response } from 'express';

export interface InvoiceData {
  invoiceNumber: string;
  saleDate: Date;
  customerName?: string | null;
  customerPhone?: string | null;
  paymentMethod: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    taxAmount: number;
    totalPrice: number;
    serialNumbers?: string[];
  }>;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  amountReceived: number;
  changeAmount: number;
  cashierName: string;
}

export class PdfService {
  /**
   * Generates a professional A4 format invoice PDF
   */
  static generateA4Invoice(res: Response, data: InvoiceData) {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="INVOICE_${data.invoiceNumber}.pdf"`);
    doc.pipe(res);

    // Header with Navy Blue Banner
    doc.rect(40, 40, 515, 65).fill('#0F172A');

    doc.fillColor('#FFFFFF')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('DEEP E-BIKE & TOY', 55, 52);

    doc.fontSize(9)
      .font('Helvetica')
      .text('Electric Bikes, Scooters, Kids Ride-On Vehicles & Toys', 55, 76);

    doc.fontSize(9)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', 460, 56, { align: 'right', width: 80 });

    doc.fontSize(8)
      .font('Helvetica')
      .text('ORIGINAL FOR RECIPIENT', 440, 72, { align: 'right', width: 100 });

    // Store & Customer Info section
    const startY = 120;
    doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('STORE DETAILS:', 40, startY);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text('DEEP E-BIKE & TOY', 40, startY + 12);
    doc.text('Shop No. 12-14, Green Park Main Road', 40, startY + 23);
    doc.text('Ph: +91 98765 43210 / +91 91234 56789', 40, startY + 34);
    doc.text('GSTIN: 27ABCDE1234F1Z5', 40, startY + 45);

    doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold').text('INVOICE & CUSTOMER DETAILS:', 320, startY);
    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(`Invoice No: ${data.invoiceNumber}`, 320, startY + 12);
    doc.text(`Date & Time: ${new Date(data.saleDate).toLocaleString()}`, 320, startY + 23);
    doc.text(`Customer: ${data.customerName || 'Walk-in Retail Customer'}`, 320, startY + 34);
    doc.text(`Mobile: ${data.customerPhone || 'N/A'}`, 320, startY + 45);
    doc.text(`Cashier: ${data.cashierName}`, 320, startY + 56);

    // Table Header
    const tableTop = 200;
    doc.rect(40, tableTop, 515, 22).fill('#F1F5F9');
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(8);
    doc.text('#', 45, tableTop + 6);
    doc.text('ITEM DESCRIPTION', 70, tableTop + 6);
    doc.text('QTY', 280, tableTop + 6, { align: 'center', width: 30 });
    doc.text('RATE (₹)', 330, tableTop + 6, { align: 'right', width: 60 });
    doc.text('GST (%)', 410, tableTop + 6, { align: 'center', width: 45 });
    doc.text('AMOUNT (₹)', 480, tableTop + 6, { align: 'right', width: 65 });

    let currentY = tableTop + 26;
    doc.font('Helvetica').fontSize(8).fillColor('#1E293B');

    data.items.forEach((item, index) => {
      doc.text(String(index + 1), 45, currentY);
      doc.text(item.productName, 70, currentY, { width: 200 });

      // If serials attached, show on next subline
      let extraHeight = 0;
      if (item.serialNumbers && item.serialNumbers.length > 0) {
        doc.fillColor('#EA580C').fontSize(7);
        doc.text(`Serials: ${item.serialNumbers.join(', ')}`, 70, currentY + 11, { width: 200 });
        doc.fillColor('#1E293B').fontSize(8);
        extraHeight = 11;
      }

      doc.text(String(item.quantity), 280, currentY, { align: 'center', width: 30 });
      doc.text(item.unitPrice.toFixed(2), 330, currentY, { align: 'right', width: 60 });
      doc.text(`${item.gstRate}%`, 410, currentY, { align: 'center', width: 45 });
      doc.text(item.totalPrice.toFixed(2), 480, currentY, { align: 'right', width: 65 });

      currentY += 18 + extraHeight;
      doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#E2E8F0').stroke();
      currentY += 4;
    });

    // Summary Section
    const summaryY = Math.max(currentY + 15, 420);
    doc.rect(330, summaryY, 225, 105).fill('#F8FAFC').stroke('#CBD5E1');

    doc.fillColor('#475569').fontSize(8).font('Helvetica');
    doc.text('Subtotal:', 340, summaryY + 10);
    doc.text(`₹ ${data.subtotal.toFixed(2)}`, 450, summaryY + 10, { align: 'right', width: 95 });

    doc.text('Total GST Tax:', 340, summaryY + 24);
    doc.text(`₹ ${data.taxAmount.toFixed(2)}`, 450, summaryY + 24, { align: 'right', width: 95 });

    if (data.discountAmount > 0) {
      doc.text('Discount Applied:', 340, summaryY + 38);
      doc.text(`- ₹ ${data.discountAmount.toFixed(2)}`, 450, summaryY + 38, { align: 'right', width: 95 });
    }

    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
    doc.text('Grand Total:', 340, summaryY + 54);
    doc.text(`₹ ${data.grandTotal.toFixed(2)}`, 450, summaryY + 54, { align: 'right', width: 95 });

    doc.font('Helvetica').fontSize(8).fillColor('#475569');
    doc.text(`Payment: ${data.paymentMethod}`, 340, summaryY + 74);
    doc.text(`Received: ₹ ${data.amountReceived.toFixed(2)}`, 340, summaryY + 86);
    doc.text(`Change: ₹ ${data.changeAmount.toFixed(2)}`, 450, summaryY + 86, { align: 'right', width: 95 });

    // Terms and Signatures
    const footerY = 660;
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#334155').text('TERMS & CONDITIONS:', 40, footerY);
    doc.font('Helvetica').fontSize(7).fillColor('#64748B');
    doc.text('1. Goods once sold cannot be returned without original invoice within 7 days.', 40, footerY + 10);
    doc.text('2. Batteries and electronic controllers carry standard manufacturer warranty as applicable.', 40, footerY + 19);
    doc.text('3. Physical or water damage voids any free service claims.', 40, footerY + 28);
    doc.text('Thank you for shopping at DEEP E-BIKE & TOY!', 40, footerY + 40, { align: 'center', width: 515 });

    // Authorized Signature
    doc.moveTo(420, footerY + 45).lineTo(540, footerY + 45).strokeColor('#94A3B8').stroke();
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#0F172A').text('Authorized Signatory', 420, footerY + 50, { align: 'center', width: 120 });

    doc.end();
  }
}
