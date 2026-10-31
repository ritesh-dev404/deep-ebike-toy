import React from 'react';
import { Sale } from '../../types';
import { numberToIndianWords } from '../../utils/numberToWords';
import {
  TOP_BANNER_BASE64 as TOP_BANNER_IMG,
  BOTTOM_BANNER_BASE64 as BOTTOM_BANNER_IMG,
  SCOOTERS_BASE64 as SCOOTERS_IMG,
  TOYS_BASE64 as TOYS_IMG,
  QR_CODE_BASE64 as QR_CODE_IMG,
  THANK_YOU_BASE64 as THANK_YOU_IMG,
} from './invoiceAssets';
import {
  ShieldCheck,
  Wrench,
  Zap,
  Headphones,
  CheckCircle2,
  CreditCard,
  FileText,
  User,
} from 'lucide-react';

interface A4InvoiceProps {
  sale: Sale;
}

export const A4Invoice: React.FC<A4InvoiceProps> = ({ sale }) => {
  // Format numbers into Indian comma format with 2 decimals
  const formatInr = (val: number = 0) => {
    return val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const saleDateObj = new Date(sale.saleDate);
  const formattedDate = saleDateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = saleDateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const totalDiscount = sale.discountAmount || 0;
  const grandTotal = sale.grandTotal || 0;
  const taxAmount = sale.taxAmount || 0;
  const halfTax = taxAmount / 2;
  const taxableAmount = Math.max(0, grandTotal - taxAmount);
  const subtotal = taxableAmount + totalDiscount;

  // Compute average or dominant CGST/SGST percentage
  const avgGst =
    taxableAmount > 0 ? Math.round((taxAmount / taxableAmount) * 100) : 12;
  const halfGst = avgGst / 2;

  return (
    <div
      id="printable-a4-invoice"
      className="bg-white text-slate-900 font-sans mx-auto shadow-2xl border border-slate-300 print:shadow-none print:border-none print:m-0 w-full max-w-[210mm] text-[10px] leading-tight select-none flex flex-col justify-between"
      style={{
        boxSizing: 'border-box',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        minHeight: '296mm',
      }}
    >
      <div>
        {/* 1. TOP HEADER BANNER */}
        <div className="w-full relative">
          <img
            src={TOP_BANNER_IMG}
            alt="DEEP E-BIKE & TOY Header"
            className="w-full block object-cover"
          />
          {/* Category Sub-strip */}
          <div className="w-full bg-[#082C50] text-[#E5A823] font-black text-[9px] tracking-wider uppercase py-0.5 text-center flex justify-center items-center gap-3 border-t border-[#EDC554]">
            <span>ELECTRIC VEHICLES</span>
            <span className="text-white/40">|</span>
            <span>TOYS & GIFTS</span>
            <span className="text-white/40">|</span>
            <span>SPARE PARTS</span>
            <span className="text-white/40">|</span>
            <span>ACCESSORIES</span>
          </div>
        </div>

        <div className="px-4 pt-1.5 pb-1 space-y-2">
          {/* 2. HERO VISUAL SECTION: SCOOTERS | TAX INVOICE | TOYS */}
          <div className="grid grid-cols-12 items-center gap-1">
            {/* Left: Electric Scooters */}
            <div className="col-span-4 flex justify-start items-center">
              <img
                src={SCOOTERS_IMG}
                alt="Electric Scooters"
                className="h-20 object-contain"
              />
            </div>

            {/* Center: Tax Invoice Ribbon */}
            <div className="col-span-4 text-center space-y-0.5">
              <div className="relative inline-flex items-center justify-center">
                {/* Angled Golden Accents on Left */}
                <div className="flex gap-1 mr-1.5 text-[#E5A823] font-black text-sm select-none">
                  <span>/</span>
                  <span>/</span>
                </div>

                {/* Navy Banner */}
                <div className="bg-[#082C50] text-white font-black text-xs px-5 py-1 rounded-sm tracking-widest uppercase shadow-sm">
                  TAX INVOICE
                </div>

                {/* Angled Golden Accents on Right */}
                <div className="flex gap-1 ml-1.5 text-[#E5A823] font-black text-sm select-none">
                  <span>/</span>
                  <span>/</span>
                </div>
              </div>

              <p className="text-[#082C50] font-serif italic text-[11px] font-bold tracking-wide">
                Sales Invoice
              </p>
            </div>

            {/* Right: Toys */}
            <div className="col-span-4 flex justify-end items-center">
              <img
                src={TOYS_IMG}
                alt="Kids Toys"
                className="h-18 object-contain"
              />
            </div>
          </div>

          {/* 3. INVOICE META INFORMATION BOX */}
          <div className="border border-slate-300 rounded-lg p-2 bg-white shadow-xs">
            <div className="grid grid-cols-2 divide-x divide-slate-300">
              {/* Left Meta */}
              <div className="pr-3 space-y-0.5">
                <div className="flex">
                  <span className="w-24 text-slate-700 font-semibold">Invoice No.</span>
                  <span className="text-slate-500 mr-2">:</span>
                  <span className="font-bold text-[#082C50] font-mono">
                    {sale.invoiceNumber || 'INV-2026-0013'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-700 font-semibold">Invoice Date</span>
                  <span className="text-slate-500 mr-2">:</span>
                  <span className="font-bold text-slate-900">{formattedDate}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-slate-700 font-semibold">Invoice Time</span>
                  <span className="text-slate-500 mr-2">:</span>
                  <span className="font-bold text-slate-900">{formattedTime}</span>
                </div>
              </div>

              {/* Right Meta */}
              <div className="pl-3 space-y-0.5">
                <div className="flex items-center">
                  <span className="w-26 text-slate-700 font-semibold">Payment Status</span>
                  <span className="text-slate-500 mr-2">:</span>
                  <span className="bg-[#16A34A] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    {sale.paymentStatus === 'PENDING' ? 'Pending' : 'Paid'}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-26 text-slate-700 font-semibold">Payment Mode</span>
                  <span className="text-slate-500 mr-2">:</span>
                  <span className="font-bold text-slate-900">{sale.paymentMethod || 'UPI'}</span>
                </div>
                <div className="flex">
                  <span className="w-26 text-slate-700 font-semibold">Sales Executive</span>
                  <span className="text-slate-500 mr-2">:</span>
                  <span className="font-bold text-slate-900">
                    {sale.createdBy?.fullName || 'Ritesh Tihile'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. CUSTOMER DETAILS BOX */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
            {/* Header */}
            <div className="bg-[#082C50] text-white px-2.5 py-0.5 flex items-center gap-1.5 text-[10.5px] font-bold">
              <User className="w-3 h-3 fill-white text-white" />
              <span>Customer Details</span>
            </div>
            {/* Body */}
            <div className="p-2 space-y-0.5 bg-white">
              <div className="flex">
                <span className="w-26 text-slate-700 font-semibold">Customer Name</span>
                <span className="text-slate-500 mr-2">:</span>
                <span className="font-bold text-slate-900">
                  {sale.customer?.name || sale.customerName || 'Rahul Sharma'}
                </span>
              </div>
              <div className="flex">
                <span className="w-26 text-slate-700 font-semibold">Mobile Number</span>
                <span className="text-slate-500 mr-2">:</span>
                <span className="font-bold text-slate-900">
                  {sale.customer?.phone || sale.customerPhone || '9876543210'}
                </span>
              </div>
              <div className="flex">
                <span className="w-26 text-slate-700 font-semibold">Address</span>
                <span className="text-slate-500 mr-2">:</span>
                <span className="font-semibold text-slate-800">
                  {sale.customer?.address || sale.customerAddress || 'Morshi, Amravati, Maharashtra - 444905'}
                </span>
              </div>
            </div>
          </div>

          {/* 5. PRODUCT TABLE */}
          <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
            <table className="w-full border-collapse text-[9.5px]">
              <thead>
                <tr className="bg-[#082C50] text-white font-bold text-center border-b border-slate-300">
                  <th className="py-1.5 px-1 border-r border-slate-600/50 w-7">Sr.<br />No.</th>
                  <th className="py-1.5 px-2 text-left border-r border-slate-600/50">Product / Description</th>
                  <th className="py-1.5 px-1 border-r border-slate-600/50 w-22">Model / Variant</th>
                  <th className="py-1.5 px-1 border-r border-slate-600/50 w-16">HSN /<br />SAC</th>
                  <th className="py-1.5 px-1 border-r border-slate-600/50 w-9">Qty</th>
                  <th className="py-1.5 px-1.5 text-right border-r border-slate-600/50 w-20">Unit Price<br />(₹)</th>
                  <th className="py-1.5 px-1.5 text-right border-r border-slate-600/50 w-16">Discount<br />(₹)</th>
                  <th className="py-1.5 px-1 border-r border-slate-600/50 w-12">GST<br />(%)</th>
                  <th className="py-1.5 px-2 text-right w-22">Total Amount<br />(₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-slate-800">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((item, idx) => {
                    const serials = item.serialNumbersJson
                      ? JSON.parse(item.serialNumbersJson)
                      : [];

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-1 px-1 text-center font-bold border-r border-slate-300">
                          {idx + 1}
                        </td>
                        <td className="py-1 px-2 text-left border-r border-slate-300">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          {serials.length > 0 ? (
                            <div className="text-[8.5px] text-orange-600 font-semibold">
                              Chassis/Serial: {serials.join(', ')}
                            </div>
                          ) : (
                            <div className="text-[8.5px] text-slate-500">
                              {item.product?.category?.name || 'Retail Product'}
                            </div>
                          )}
                        </td>
                        <td className="py-1 px-1 text-center border-r border-slate-300 font-semibold text-slate-700">
                          {item.product?.modelNumber || item.product?.brand || 'Standard'}
                        </td>
                        <td className="py-1 px-1 text-center border-r border-slate-300 font-mono text-slate-600">
                          {item.hsnCode || (item.gstRate === 5 ? '871160' : item.gstRate === 12 ? '950300' : '851290')}
                        </td>
                        <td className="py-1 px-1 text-center font-bold border-r border-slate-300">
                          {item.quantity}
                        </td>
                        <td className="py-1 px-1.5 text-right border-r border-slate-300 font-semibold">
                          {formatInr(item.unitPrice)}
                        </td>
                        <td className="py-1 px-1.5 text-right border-r border-slate-300 text-slate-600">
                          {formatInr(item.discount || 0)}
                        </td>
                        <td className="py-1 px-1 text-center border-r border-slate-300 font-semibold">
                          {item.gstRate}%
                        </td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {formatInr(item.totalPrice)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-3 text-center text-slate-400">
                      No items in this invoice
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 6. FOUR FEATURE BADGES */}
          <div className="grid grid-cols-4 gap-2">
            <div className="border border-slate-300 rounded-lg p-1.5 text-center bg-white shadow-xs space-y-0.5">
              <div className="flex justify-center text-[#E5A823]">
                <ShieldCheck className="w-4 h-4 fill-[#E5A823]/20" />
              </div>
              <div className="font-bold text-[9px] text-slate-900 leading-none">Warranty Available</div>
            </div>

            <div className="border border-slate-300 rounded-lg p-1.5 text-center bg-white shadow-xs space-y-0.5">
              <div className="flex justify-center text-[#E5A823]">
                <Wrench className="w-4 h-4 fill-[#E5A823]/20" />
              </div>
              <div className="font-bold text-[9px] text-slate-900 leading-none">After-Sales Support</div>
            </div>

            <div className="border border-slate-300 rounded-lg p-1.5 text-center bg-white shadow-xs space-y-0.5">
              <div className="flex justify-center text-[#E5A823]">
                <Zap className="w-4 h-4 fill-[#E5A823]" />
              </div>
              <div className="font-bold text-[9px] text-slate-900 leading-none">Genuine Accessories</div>
            </div>

            <div className="border border-slate-300 rounded-lg p-1.5 text-center bg-white shadow-xs space-y-0.5">
              <div className="flex justify-center text-[#E5A823]">
                <Headphones className="w-4 h-4 fill-[#E5A823]/20" />
              </div>
              <div className="font-bold text-[9px] text-slate-900 leading-none">Service & Maintenance</div>
            </div>
          </div>

          {/* 7. AMOUNT IN WORDS & TOTALS BREAKDOWN */}
          <div className="grid grid-cols-12 gap-2.5 items-stretch">
            {/* Left Column: Amount in Words */}
            <div className="col-span-6 bg-[#FDF6E2] border border-[#FDE68A] rounded-lg p-2.5 flex items-start gap-2 shadow-xs">
              {/* Golden Rupee Icon Coin */}
              <div className="w-6 h-6 rounded-full bg-[#E5A823] flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                ₹
              </div>
              <div className="space-y-0.5">
                <div className="text-[9px] font-bold text-slate-800 uppercase tracking-wide">
                  Amount in Words :
                </div>
                <div className="font-bold text-[10px] text-[#082C50] leading-snug">
                  {numberToIndianWords(grandTotal)}
                </div>
              </div>
            </div>

            {/* Right Column: Calculations Breakdown & Grand Total */}
            <div className="col-span-6 border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
              <div className="p-1.5 space-y-0.5 text-[9.5px]">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-bold text-slate-900">₹ {formatInr(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Product Discount</span>
                  <span className="font-bold text-slate-900">
                    {totalDiscount > 0 ? `(-) ₹ ${formatInr(totalDiscount)}` : `₹ 0.00`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Taxable Amount</span>
                  <span className="font-bold text-slate-900">₹ {formatInr(taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">CGST ({halfGst}%)</span>
                  <span className="font-bold text-slate-900">₹ {formatInr(halfTax)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">SGST ({halfGst}%)</span>
                  <span className="font-bold text-slate-900">₹ {formatInr(halfTax)}</span>
                </div>
              </div>

              {/* Grand Total Golden Bar */}
              <div className="bg-[#E5A823] text-[#082C50] font-black px-3 py-1.5 flex justify-between items-center text-[11px] border-t border-[#EDC554]">
                <span className="uppercase tracking-wide">Grand Total</span>
                <span className="text-sm tracking-tight">₹ {formatInr(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* 8. TERMS & CONDITIONS AND PAYMENT DETAILS */}
          <div className="grid grid-cols-2 gap-2.5 items-stretch">
            {/* Left: Terms & Conditions */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="bg-[#082C50] text-white px-2.5 py-0.5 flex items-center gap-1.5 text-[10px] font-bold">
                  <FileText className="w-3 h-3" />
                  <span>Terms & Conditions :</span>
                </div>
                <div className="p-1.5 space-y-0.5 text-[9px] text-slate-700">
                  <div className="flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-900 shrink-0 mt-0.5" />
                    <span>Goods once sold will not be taken back or exchanged.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-900 shrink-0 mt-0.5" />
                    <span>Warranty as per manufacturer's policy.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-900 shrink-0 mt-0.5" />
                    <span>Physical damage / misused products are not covered under warranty.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-900 shrink-0 mt-0.5" />
                    <span>All disputes are subject to Morshi jurisdiction only.</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-slate-900 shrink-0 mt-0.5" />
                    <span>Please keep the invoice for future service and warranty claims.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Details & QR Code */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="bg-[#082C50] text-white px-2.5 py-0.5 flex items-center gap-1.5 text-[10px] font-bold">
                  <CreditCard className="w-3 h-3" />
                  <span>Payment Details</span>
                </div>
                <div className="p-1.5 flex items-center justify-between gap-1.5">
                  {/* Bank / UPI Text */}
                  <div className="space-y-0.5 text-[9px]">
                    <div className="flex">
                      <span className="w-13 text-slate-600 font-semibold">UPI ID</span>
                      <span className="text-slate-500 mr-1">:</span>
                      <span className="font-bold text-slate-900">deepebiketoy@upi</span>
                    </div>
                    <div className="flex">
                      <span className="w-13 text-slate-600 font-semibold">Bank</span>
                      <span className="text-slate-500 mr-1">:</span>
                      <span className="font-semibold text-slate-900">State Bank of India (SBI)</span>
                    </div>
                    <div className="flex">
                      <span className="w-13 text-slate-600 font-semibold">A/c No.</span>
                      <span className="text-slate-500 mr-1">:</span>
                      <span className="font-mono font-bold text-slate-900">123456789012</span>
                    </div>
                    <div className="flex">
                      <span className="w-13 text-slate-600 font-semibold">IFSC</span>
                      <span className="text-slate-500 mr-1">:</span>
                      <span className="font-mono font-bold text-slate-900">SBIN0001234</span>
                    </div>
                  </div>

                  {/* QR Code & Scan & Pay */}
                  <div className="flex flex-col items-center">
                    <div className="border border-slate-400 p-0.5 rounded bg-white shadow-xs">
                      <img
                        src={QR_CODE_IMG}
                        alt="UPI Scan & Pay QR Code"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                    <div className="bg-[#082C50] text-white text-[8px] font-bold px-2 py-0.5 rounded-full mt-0.5">
                      Scan & Pay
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 9. SIGNATURES & THANK YOU (EXACT 3-COLUMN CSS GRID - BLANK SIGNATURE SPACES) */}
          <div className="grid grid-cols-12 items-end pt-3 pb-2 text-center">
            {/* Left Column: Customer Signature (Blank 25-30mm White Space + Line + Text) */}
            <div className="col-span-4 flex flex-col items-center justify-end">
              {/* 25-30mm blank white space for handwritten customer signature */}
              <div className="h-16 w-full bg-white" />
              {/* Thin black signature line */}
              <div className="w-44 border-t border-slate-900 mx-auto" />
              {/* Customer Signature text below */}
              <p className="font-bold text-[10.5px] text-slate-900 mt-1.5 tracking-wide">
                Customer Signature
              </p>
            </div>

            {/* Center Column: Thank You Section (Centered, Uncropped, No Overlap) */}
            <div className="col-span-4 flex flex-col items-center justify-center">
              <img
                src={THANK_YOU_IMG}
                alt="Thank You for Shopping with DEEP E-BIKE & TOY"
                className="h-16 w-auto object-contain mx-auto"
              />
            </div>

            {/* Right Column: Authorized Signature (Blank 25-30mm White Space + Line + Text) */}
            <div className="col-span-4 flex flex-col items-center justify-end">
              {/* 25-30mm blank white space for handwritten authorized signature */}
              <div className="h-16 w-full bg-white" />
              {/* Thin black signature line */}
              <div className="w-44 border-t border-slate-900 mx-auto" />
              {/* Authorized Signature text below */}
              <p className="font-bold text-[10.5px] text-slate-900 mt-1.5 tracking-wide">
                Authorized Signature
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 10. FOOTER (COMPLETE NAVY & GOLD FOOTER RIBBON, CLEANLY PLACED BELOW SIGNATURES) */}
      <div className="w-full">
        <img
          src={BOTTOM_BANNER_IMG}
          alt="DEEP E-BIKE & TOY Footer"
          className="w-full block object-cover"
        />
      </div>
    </div>
  );
};
