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
    modelVariant?: string | null;
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
   * Matching exact visual theme of DEEP E-BIKE & TOY reference design
   */
  static generateA4Invoice(res: Response, data: InvoiceData) {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 25,
      bufferPages: true,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="INVOICE_${data.invoiceNumber}.pdf"`
    );
    doc.pipe(res);

    const navyColor = '#082C50'; // Deep Royal Navy
    const goldColor = '#E5A823'; // Golden Amber Accent
    const goldBg = '#FDF6E2';
    const lightBg = '#F8FAFC';
    const borderColor = '#CBD5E1';

    // 1. Outer Border
    doc.rect(25, 25, 545, 792).lineWidth(1).strokeColor(borderColor).stroke();

    // 2. Top Header Box
    doc.rect(25, 25, 545, 68).fill(navyColor);

    // Brand Title
    doc.fillColor('#FFFFFF')
      .fontSize(19)
      .font('Helvetica-Bold')
      .text('DEEP E-BIKE & TOY', 38, 35);

    doc.fillColor(goldColor)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('SALES  |  SERVICE  |  ACCESSORIES', 38, 56);

    doc.fillColor('#E2E8F0')
      .fontSize(7.5)
      .font('Helvetica')
      .text('Near Datta Mandir, Ward Road, Morshi, Maharashtra - 444905', 38, 68);

    doc.text('Mobile: 9890256419   |   Email: deepebiketoy@gmail.com', 38, 78);

    // TAX INVOICE Title Badge (Top Right)
    doc.rect(425, 34, 130, 22).fill(goldColor);
    doc.fillColor(navyColor)
      .fontSize(11)
      .font('Helvetica-Bold')
      .text('TAX INVOICE', 425, 40, { align: 'center', width: 130 });

    doc.fillColor('#FFFFFF')
      .fontSize(7)
      .font('Helvetica')
      .text('Original For Recipient', 425, 60, { align: 'center', width: 130 });

    // Category Sub-strip
    doc.rect(25, 93, 545, 14).fill('#041E38');
    doc.fillColor(goldColor).fontSize(7).font('Helvetica-Bold')
      .text('ELECTRIC VEHICLES   |   TOYS & GIFTS   |   SPARE PARTS   |   ACCESSORIES', 25, 96, { align: 'center', width: 545 });

    // 3. Invoice Meta Box
    const metaY = 113;
    doc.rect(25, metaY, 545, 42).fill(lightBg).strokeColor(borderColor).stroke();

    const formattedDate = new Date(data.saleDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = new Date(data.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
    // Left
    doc.text(`Invoice No.    : `, 35, metaY + 7);
    doc.font('Helvetica-Bold').fillColor(navyColor).text(data.invoiceNumber, 95, metaY + 7);
    doc.font('Helvetica').fillColor('#334155');
    doc.text(`Invoice Date   : ${formattedDate}`, 35, metaY + 18);
    doc.text(`Invoice Time   : ${formattedTime}`, 35, metaY + 29);

    // Divider line
    doc.moveTo(295, metaY + 5).lineTo(295, metaY + 37).strokeColor(borderColor).stroke();

    // Right
    doc.text(`Payment Status : `, 310, metaY + 7);
    doc.font('Helvetica-Bold').fillColor('#16A34A').text(data.paymentStatus === 'PENDING' ? 'Pending' : 'Paid', 380, metaY + 7);
    doc.font('Helvetica').fillColor('#334155');
    doc.text(`Payment Mode   : ${data.paymentMethod}`, 310, metaY + 18);
    doc.text(`Sales Executive: ${data.cashierName}`, 310, metaY + 29);

    // 4. Customer Details Box
    const custY = 160;
    doc.rect(25, custY, 545, 16).fill(navyColor);
    doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('Customer Details', 35, custY + 4);

    doc.rect(25, custY + 16, 545, 38).fill(lightBg).strokeColor(borderColor).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
    doc.text(`Customer Name  : `, 35, custY + 21);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(data.customerName || 'Rahul Sharma', 105, custY + 21);
    doc.font('Helvetica').fillColor('#334155');
    doc.text(`Mobile Number  : ${data.customerPhone || '9876543210'}`, 35, custY + 32);
    doc.text(`Address        : ${data.customerAddress || 'Morshi, Amravati, Maharashtra - 444905'}`, 35, custY + 43, { width: 520 });

    // 5. Products Table Header
    const tableTop = 220;
    doc.rect(25, tableTop, 545, 20).fill(navyColor);

    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(7);
    doc.text('Sr. No.', 28, tableTop + 6, { width: 25, align: 'center' });
    doc.text('Product / Description', 58, tableTop + 6, { width: 175 });
    doc.text('Model / Variant', 235, tableTop + 6, { width: 70, align: 'center' });
    doc.text('HSN / SAC', 310, tableTop + 6, { width: 45, align: 'center' });
    doc.text('Qty', 360, tableTop + 6, { width: 25, align: 'center' });
    doc.text('Unit Price (₹)', 390, tableTop + 6, { width: 48, align: 'right' });
    doc.text('Disc (₹)', 442, tableTop + 6, { width: 35, align: 'right' });
    doc.text('GST (%)', 480, tableTop + 6, { width: 30, align: 'center' });
    doc.text('Total (₹)', 515, tableTop + 6, { width: 50, align: 'right' });

    let currentY = tableTop + 24;
    doc.font('Helvetica').fontSize(7.5).fillColor('#1E293B');

    data.items.forEach((item, index) => {
      const isEven = index % 2 === 0;
      let lineItemHeight = 18;
      const serials = item.serialNumbers && item.serialNumbers.length > 0 ? item.serialNumbers : [];
      if (serials.length > 0) lineItemHeight += 10;

      if (isEven) {
        doc.rect(25, currentY - 3, 545, lineItemHeight).fill('#F8FAFC');
      }

      doc.fillColor('#1E293B').font('Helvetica-Bold').text(String(index + 1), 28, currentY, { width: 25, align: 'center' });
      doc.text(item.productName, 58, currentY, { width: 175 });

      if (serials.length > 0) {
        doc.fillColor('#EA580C').fontSize(6.5).font('Helvetica');
        doc.text(`Chassis/Serial: ${serials.join(', ')}`, 58, currentY + 10, { width: 175 });
        doc.fillColor('#1E293B').fontSize(7.5);
      }

      doc.font('Helvetica').text(item.modelVariant || 'Standard', 235, currentY, { width: 70, align: 'center' });
      doc.text(item.hsnCode || (item.gstRate === 5 ? '871160' : item.gstRate === 12 ? '950300' : '851290'), 310, currentY, { width: 45, align: 'center' });
      doc.font('Helvetica-Bold').text(String(item.quantity), 360, currentY, { width: 25, align: 'center' });
      doc.font('Helvetica').text(item.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 390, currentY, { width: 48, align: 'right' });
      doc.text(item.discount ? item.discount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00', 442, currentY, { width: 35, align: 'right' });
      doc.text(`${item.gstRate}%`, 480, currentY, { width: 30, align: 'center' });
      doc.font('Helvetica-Bold').text(item.totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 515, currentY, { width: 50, align: 'right' });

      currentY += lineItemHeight;
      doc.moveTo(25, currentY - 2).lineTo(570, currentY - 2).lineWidth(0.5).strokeColor('#E2E8F0').stroke();
    });

    // 6. Four Feature Badges
    const badgeY = Math.max(currentY + 6, 420);
    const badgeW = 130;
    const badgeGap = 8;
    const badges = [
      { title: 'Warranty', sub: 'Available' },
      { title: 'After-Sales', sub: 'Support' },
      { title: 'Genuine', sub: 'Accessories' },
      { title: 'Service &', sub: 'Maintenance' },
    ];

    badges.forEach((b, i) => {
      const bx = 25 + i * (badgeW + badgeGap);
      doc.rect(bx, badgeY, badgeW, 26).fill(lightBg).strokeColor(borderColor).stroke();
      doc.fillColor(navyColor).fontSize(7.5).font('Helvetica-Bold').text(b.title, bx, badgeY + 4, { align: 'center', width: badgeW });
      doc.fillColor('#64748B').fontSize(6.5).font('Helvetica').text(b.sub, bx, badgeY + 14, { align: 'center', width: badgeW });
    });

    // 7. Amount in Words & Totals Section
    const halfTax = data.taxAmount / 2;
    const taxableAmount = Math.max(0, data.grandTotal - data.taxAmount);
    const summaryTop = badgeY + 34;

    // Left Box: Amount in Words
    doc.rect(25, summaryTop, 275, 95).fill(goldBg).strokeColor('#FDE68A').stroke();
    doc.fillColor(navyColor).fontSize(7.5).font('Helvetica-Bold').text('AMOUNT IN WORDS :', 35, summaryTop + 10);
    doc.fillColor(navyColor).fontSize(8.5).font('Helvetica-Bold').text(numberToIndianWords(data.grandTotal), 35, summaryTop + 24, { width: 255 });

    // Right Box: Tax Breakdown & Grand Total
    doc.rect(305, summaryTop, 265, 95).fill(lightBg).strokeColor(borderColor).stroke();

    let subY = summaryTop + 7;
    doc.font('Helvetica').fontSize(7.5).fillColor('#475569');

    doc.text('Subtotal', 315, subY);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(`₹ ${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, subY, { align: 'right', width: 115 });
    subY += 12;

    doc.font('Helvetica').fillColor('#475569').text('Product Discount', 315, subY);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(data.discountAmount > 0 ? `(-) ₹ ${data.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹ 0.00', 445, subY, { align: 'right', width: 115 });
    subY += 12;

    doc.font('Helvetica').fillColor('#475569').text('Taxable Amount', 315, subY);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(`₹ ${taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, subY, { align: 'right', width: 115 });
    subY += 12;

    doc.font('Helvetica').fillColor('#475569').text('CGST (Central Tax)', 315, subY);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(`₹ ${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, subY, { align: 'right', width: 115 });
    subY += 12;

    doc.font('Helvetica').fillColor('#475569').text('SGST (State Tax)', 315, subY);
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(`₹ ${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, subY, { align: 'right', width: 115 });
    subY += 15;

    // Grand Total Golden Bar
    doc.rect(305, subY - 3, 265, 23).fill(goldColor);
    doc.fillColor(navyColor).fontSize(10).font('Helvetica-Bold');
    doc.text('GRAND TOTAL', 315, subY + 3);
    doc.text(`₹ ${data.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 445, subY + 3, { align: 'right', width: 115 });

    // 8. Terms & Conditions and Payment Details
    const bottomSectionY = summaryTop + 104;

    // Left: Terms & Conditions Box
    doc.rect(25, bottomSectionY, 275, 14).fill(navyColor);
    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('Terms & Conditions :', 35, bottomSectionY + 3);

    doc.rect(25, bottomSectionY + 14, 275, 68).fill(lightBg).strokeColor(borderColor).stroke();
    doc.font('Helvetica').fontSize(6.5).fillColor('#334155');
    doc.text('• Goods once sold will not be taken back or exchanged.', 32, bottomSectionY + 20);
    doc.text("• Warranty as per manufacturer's policy.", 32, bottomSectionY + 31);
    doc.text('• Physical damage / misused products are not covered under warranty.', 32, bottomSectionY + 42);
    doc.text('• All disputes are subject to Morshi jurisdiction only.', 32, bottomSectionY + 53);
    doc.text('• Please keep the invoice for future service and warranty claims.', 32, bottomSectionY + 64);

    // Right: Payment Details Box
    doc.rect(305, bottomSectionY, 265, 14).fill(navyColor);
    doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold').text('Payment Details', 315, bottomSectionY + 3);

    doc.rect(305, bottomSectionY + 14, 265, 68).fill(lightBg).strokeColor(borderColor).stroke();
    doc.font('Helvetica').fontSize(7).fillColor('#334155');
    doc.text('UPI ID   : deepebiketoy@upi', 315, bottomSectionY + 22);
    doc.text('Bank     : State Bank of India (SBI)', 315, bottomSectionY + 34);
    doc.text('A/c No.  : 123456789012', 315, bottomSectionY + 46);
    doc.text('IFSC     : SBIN0001234', 315, bottomSectionY + 58);

    doc.rect(495, bottomSectionY + 20, 58, 48).fill('#FFFFFF').strokeColor(borderColor).stroke();
    doc.fillColor(navyColor).fontSize(6).font('Helvetica-Bold').text('UPI QR', 495, bottomSectionY + 34, { align: 'center', width: 58 });
    doc.rect(500, bottomSectionY + 54, 48, 10).fill(navyColor);
    doc.fillColor('#FFFFFF').fontSize(5.5).font('Helvetica-Bold').text('Scan & Pay', 500, bottomSectionY + 56, { align: 'center', width: 48 });

    // 9. Signatures & Thank You Section
    const sigY = bottomSectionY + 88;

    // Customer Signature
    doc.moveTo(45, sigY + 22).lineTo(165, sigY + 22).strokeColor('#475569').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('Customer Signature', 45, sigY + 25, { align: 'center', width: 120 });

    // Center Thank You
    doc.fillColor('#92400E').fontSize(11).font('Helvetica-Bold').text('Thank You!', 195, sigY + 6, { align: 'center', width: 180 });
    doc.fillColor('#64748B').fontSize(7).font('Helvetica').text('for Shopping with', 195, sigY + 18, { align: 'center', width: 180 });
    doc.fillColor(navyColor).fontSize(7.5).font('Helvetica-Bold').text('DEEP E-BIKE & TOY', 195, sigY + 27, { align: 'center', width: 180 });

    // Authorized Signature
    doc.moveTo(405, sigY + 22).lineTo(525, sigY + 22).strokeColor('#475569').stroke();
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0F172A').text('Authorized Signature', 405, sigY + 25, { align: 'center', width: 120 });

    // 10. Bottom Banner
    doc.rect(25, 792, 545, 25).fill(navyColor);
    doc.fillColor(goldColor).fontSize(7.5).font('Helvetica-Bold')
      .text('Electric Bikes & Scooters   |   Kids Ride-On Toys   |   Spare Parts   |   Service & Support', 25, 800, { align: 'center', width: 545 });

    doc.end();
  }
}
