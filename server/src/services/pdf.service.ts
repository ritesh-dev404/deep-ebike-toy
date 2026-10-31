import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { numberToIndianWords } from '../utils/numberToWords';

export interface InvoiceData {
  invoiceNumber: string;
  saleDate: Date;
  customerName?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  paymentMethod: string;
  paymentStatus?: string;
  items: Array<{
    productName: string;
    hsnCode?: string | null;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    taxAmount: number;
    discount?: number;
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
   * Generates a professional, print-perfect A4 TAX INVOICE
   */
  static generateA4Invoice(res: Response, data: InvoiceData) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 30,
      bufferPages: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="INVOICE_${data.invoiceNumber}.pdf"`
    );
    doc.pipe(res);

    const primaryColor = '#0F172A'; // Dark Navy Blue
    const accentColor = '#EA580C'; // Vivid Orange Accent
    const lightBg = '#F8FAFC';
    const borderColor = '#CBD5E1';

    // 1. Outer Border
    doc.rect(30, 30, 535, 782).lineWidth(1).strokeColor(borderColor).stroke();

    // 2. Top Header Box
    doc.rect(30, 30, 535, 75).fill(primaryColor);

    // Brand Title & Tagline
    doc.fillColor('#FFFFFF')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('DEEP E-BIKE & TOY', 45, 42);

    doc.fillColor(accentColor)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('SALES  |  SERVICE  |  ACCESSORIES', 45, 66);

    doc.fillColor('#94A3B8')
      .fontSize(8)
      .font('Helvetica')
      .text('Shop No. 12-14, Green Park Main Road, City Center', 45, 78);

    doc.text('Mobile: +91 9890256419   |   Email: deepebiketoy@gmail.com   |   GSTIN: 27ABCDE1234F1Z5', 45, 89);

    // TAX INVOICE Title Badge (Top Right)
    doc.rect(420, 42, 130, 24).fill(accentColor);
    doc.fillColor('#FFFFFF')
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', 420, 48, { align: 'center', width: 130 });

    doc.fillColor('#E2E8F0')
      .fontSize(7.5)
      .font('Helvetica')
      .text('ORIGINAL FOR RECIPIENT', 420, 72, { align: 'center', width: 130 });

    // 3. Meta Data / Billed To Boxes (Two-Column Layout)
    const metaY = 112;
    doc.rect(30, metaY, 267, 72).fill(lightBg).strokeColor(borderColor).stroke();
    doc.rect(297, metaY, 268, 72).fill(lightBg).strokeColor(borderColor).stroke();

    // Left Column: Customer Details
    doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('BILLED TO (CUSTOMER DETAILS):', 40, metaY + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#334155');
    doc.text(`Name: ${data.customerName || 'Walk-in Retail Customer'}`, 40, metaY + 22);
    doc.text(`Mobile: ${data.customerPhone || 'N/A'}`, 40, metaY + 35);
    doc.text(`Address: ${data.customerAddress || 'In-Store Counter Purchase'}`, 40, metaY + 48, { width: 245 });

    // Right Column: Invoice Details
    doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('INVOICE INFORMATION:', 307, metaY + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#334155');
    doc.text(`Invoice No: ${data.invoiceNumber}`, 307, metaY + 22);
    doc.text(`Date & Time: ${new Date(data.saleDate).toLocaleDateString('en-IN')}  ${new Date(data.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, 307, metaY + 35);
    doc.text(`Payment: ${data.paymentMethod} (${data.paymentStatus || 'PAID'})   |   Cashier: ${data.cashierName}`, 307, metaY + 48);

    // 4. Products Table Header
    const tableTop = 192;
    doc.rect(30, tableTop, 535, 20).fill('#0F172A');

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7.5);
    doc.text('SR.', 35, tableTop + 6, { width: 20 });
    doc.text('PRODUCT / DESCRIPTION', 60, tableTop + 6, { width: 190 });
    doc.text('HSN/SAC', 255, tableTop + 6, { width: 45, align: 'center' });
    doc.text('QTY', 305, tableTop + 6, { width: 30, align: 'center' });
    doc.text('RATE (₹)', 340, tableTop + 6, { width: 55, align: 'right' });
    doc.text('DISC (₹)', 400, tableTop + 6, { width: 45, align: 'right' });
    doc.text('GST %', 450, tableTop + 6, { width: 40, align: 'center' });
    doc.text('TOTAL (₹)', 495, tableTop + 6, { width: 62, align: 'right' });

    let currentY = tableTop + 24;
    doc.font('Helvetica').fontSize(8).fillColor('#1E293B');

    data.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      let lineItemHeight = 18;
      const serials = item.serialNumbers && item.serialNumbers.length > 0 ? item.serialNumbers : [];
      if (serials.length > 0) lineItemHeight += 10;

      if (isEven) {
        doc.rect(30, currentY - 3, 535, lineItemHeight).fill('#F8FAFC');
      }

      doc.fillColor('#1E293B').font('Helvetica-Bold').text(String(index + 1), 35, currentY, { width: 20 });
      doc.text(item.productName, 60, currentY, { width: 190 });

      if (serials.length > 0) {
        doc.fillColor(accentColor).fontSize(7).font('Helvetica');
        doc.text(`Chassis/Serial: ${serials.join(', ')}`, 60, currentY + 10, { width: 190 });
        doc.fillColor('#1E293B').fontSize(8);
      }

      doc.font('Helvetica').text(item.hsnCode || '8711', 255, currentY, { width: 45, align: 'center' });
      doc.text(String(item.quantity), 305, currentY, { width: 30, align: 'center' });
      doc.text(item.unitPrice.toFixed(2), 340, currentY, { width: 55, align: 'right' });
      doc.text(item.discount ? item.discount.toFixed(2) : '0.00', 400, currentY, { width: 45, align: 'right' });
      doc.text(`${item.gstRate}%`, 450, currentY, { width: 40, align: 'center' });
      doc.font('Helvetica-Bold').text(item.totalPrice.toFixed(2), 495, currentY, { width: 62, align: 'right' });

      currentY += lineItemHeight;
      doc.moveTo(30, currentY - 2).lineTo(565, currentY - 2).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
    });

    // 5. Total Section Calculations (Taxable, CGST, SGST, Grand Total)
    const halfTax = data.taxAmount / 2;
    const taxableAmount = Math.max(0, data.grandTotal - data.taxAmount);

    const summaryTop = Math.max(currentY + 10, 480);

    // Left Box: Amount in Words & Warranty info
    doc.rect(30, summaryTop, 310, 115).fill(lightBg).strokeColor(borderColor).stroke();

    doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('AMOUNT IN WORDS:', 38, summaryTop + 8);
    doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(numberToIndianWords(data.grandTotal), 38, summaryTop + 19, { width: 295 });

    doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('WARRANTY & AFTER-SALES SUPPORT:', 38, summaryTop + 38);
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
    doc.text('• Battery & Motor: 1-Year / 2-Year Manufacturer Warranty as applicable.', 38, summaryTop + 50);
    doc.text('• Free 1st Service at 500 KM / 30 Days (Whichever occurs first).', 38, summaryTop + 62);
    doc.text('• Service Helpline: +91 9890256419  |  Email: deepebiketoy@gmail.com', 38, summaryTop + 74);
    doc.text(`• Payment Mode: ${data.paymentMethod} (Received: ₹${data.amountReceived.toFixed(2)}, Change: ₹${data.changeAmount.toFixed(2)})`, 38, summaryTop + 86);

    // Right Box: Tax Breakdown & Grand Total
    doc.rect(340, summaryTop, 225, 115).fill(lightBg).strokeColor(borderColor).stroke();

    let subY = summaryTop + 8;
    doc.font('Helvetica').fontSize(8).fillColor('#475569');

    doc.text('Subtotal:', 348, subY);
    doc.text(`₹ ${data.subtotal.toFixed(2)}`, 455, subY, { align: 'right', width: 100 });
    subY += 13;

    if (data.discountAmount > 0) {
      doc.text('Product Discount:', 348, subY);
      doc.text(`- ₹ ${data.discountAmount.toFixed(2)}`, 455, subY, { align: 'right', width: 100 });
      subY += 13;
    }

    doc.text('Taxable Amount:', 348, subY);
    doc.text(`₹ ${taxableAmount.toFixed(2)}`, 455, subY, { align: 'right', width: 100 });
    subY += 13;

    doc.text('CGST (Central Tax):', 348, subY);
    doc.text(`₹ ${halfTax.toFixed(2)}`, 455, subY, { align: 'right', width: 100 });
    subY += 13;

    doc.text('SGST (State Tax):', 348, subY);
    doc.text(`₹ ${halfTax.toFixed(2)}`, 455, subY, { align: 'right', width: 100 });
    subY += 16;

    // Grand Total Row Highlighted
    doc.rect(340, subY - 3, 225, 24).fill(primaryColor);
    doc.fillColor('#FFFFFF').fontSize(10).font('Helvetica-Bold');
    doc.text('GRAND TOTAL:', 348, subY + 3);
    doc.text(`₹ ${data.grandTotal.toFixed(2)}`, 455, subY + 3, { align: 'right', width: 100 });

    // 6. Terms & Conditions Section
    const termsY = summaryTop + 125;
    doc.fillColor(primaryColor).fontSize(7.5).font('Helvetica-Bold').text('TERMS & CONDITIONS:', 35, termsY);
    doc.font('Helvetica').fontSize(7).fillColor('#64748B');
    doc.text('1. Goods once sold are covered under standard manufacturer warranty terms and replacement policies.', 35, termsY + 11);
    doc.text('2. Please produce this original tax invoice for all future warranty claims, battery replacements, and free service.', 35, termsY + 21);
    doc.text('3. Physical impact, unauthorized electrical modifications, or water ingress void warranty claims.', 35, termsY + 31);

    // 7. Signatures & Stamp Section
    const sigY = termsY + 45;

    // Customer Signature Box
    doc.rect(40, sigY, 160, 48).strokeColor('#E2E8F0').stroke();
    doc.moveTo(50, sigY + 34).lineTo(190, sigY + 34).strokeColor('#94A3B8').stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text("Customer's Signature", 40, sigY + 37, { align: 'center', width: 160 });

    // Store Authorized Signatory Box
    doc.rect(395, sigY, 160, 48).strokeColor('#E2E8F0').stroke();
    doc.moveTo(405, sigY + 34).lineTo(545, sigY + 34).strokeColor('#94A3B8').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(primaryColor).text('For DEEP E-BIKE & TOY', 395, sigY + 6, { align: 'center', width: 160 });
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text('Authorized Signatory', 395, sigY + 37, { align: 'center', width: 160 });

    // 8. Thank You Footer
    doc.rect(30, 785, 535, 27).fill(primaryColor);
    doc.fillColor('#FFFFFF')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('Thank You for Choosing DEEP E-BIKE & TOY! Drive Green, Build a Cleaner Future.', 30, 794, { align: 'center', width: 535 });

    doc.end();
  }
}
