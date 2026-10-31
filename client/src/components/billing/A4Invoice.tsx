import React from 'react';
import { Sale } from '../../types';
import { numberToIndianWords } from '../../utils/numberToWords';
import { Zap } from 'lucide-react';

interface A4InvoiceProps {
  sale: Sale;
}

export const A4Invoice: React.FC<A4InvoiceProps> = ({ sale }) => {
  const halfTax = sale.taxAmount / 2;
  const taxableAmount = Math.max(0, sale.grandTotal - sale.taxAmount);

  return (
    <div
      id="printable-a4-invoice"
      className="bg-white text-slate-900 font-sans p-8 max-w-[210mm] mx-auto shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0 print:max-w-none text-xs leading-normal"
    >
      {/* 1. HEADER BANNER */}
      <div className="bg-slate-950 text-white p-5 rounded-t-xl flex justify-between items-center border-b-2 border-orange-500">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-black tracking-wider uppercase">DEEP E-BIKE & TOY</h1>
          </div>
          <p className="text-[11px] font-bold text-orange-400 tracking-wider uppercase">
            Sales  |  Service  |  Accessories
          </p>
          <p className="text-[10px] text-slate-300">
            Shop No. 12-14, Green Park Main Road, City Center
          </p>
          <p className="text-[10px] text-slate-300">
            Mobile: <span className="font-bold text-white">+91 9890256419</span>  |  Email: <span className="font-bold text-white">deepebiketoy@gmail.com</span>  |  GSTIN: 27ABCDE1234F1Z5
          </p>
        </div>

        <div className="text-right">
          <div className="bg-orange-600 text-white font-black text-sm px-4 py-1.5 rounded tracking-widest uppercase">
            TAX INVOICE
          </div>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">Original For Recipient</p>
        </div>
      </div>

      {/* 2. INVOICE META & CUSTOMER DETAILS BOX */}
      <div className="grid grid-cols-2 border-x border-b border-slate-300 bg-slate-50 divide-x divide-slate-300">
        {/* Customer Information */}
        <div className="p-3.5 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Billed To (Customer Details):
          </p>
          <p className="font-bold text-sm text-slate-900">
            {sale.customer?.name || sale.customerName || 'Walk-in Retail Customer'}
          </p>
          <p className="text-[11px] text-slate-600">
            Mobile: <span className="font-semibold text-slate-900">{sale.customer?.phone || sale.customerPhone || 'N/A'}</span>
          </p>
          <p className="text-[11px] text-slate-600">
            Address: <span className="text-slate-800">{sale.customer?.address || 'In-Store Counter Purchase'}</span>
          </p>
        </div>

        {/* Invoice Information */}
        <div className="p-3.5 space-y-1 text-right sm:text-left">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Invoice Information:
          </p>
          <div className="grid grid-cols-2 text-[11px] gap-y-0.5">
            <span className="text-slate-500 font-medium">Invoice No:</span>
            <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span>

            <span className="text-slate-500 font-medium">Invoice Date:</span>
            <span className="font-semibold">{new Date(sale.saleDate).toLocaleDateString('en-IN')}</span>

            <span className="text-slate-500 font-medium">Invoice Time:</span>
            <span className="font-semibold">{new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

            <span className="text-slate-500 font-medium">Payment Mode:</span>
            <span className="font-bold text-slate-900">{sale.paymentMethod} ({sale.paymentStatus || 'PAID'})</span>

            <span className="text-slate-500 font-medium">Sales Executive:</span>
            <span className="font-semibold">{sale.createdBy?.fullName || 'Store Associate'}</span>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT TABLE */}
      <table className="w-full text-left border-x border-b border-slate-300 border-collapse">
        <thead>
          <tr className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">
            <th className="py-2 px-2.5 text-center w-10">Sr.</th>
            <th className="py-2 px-3">Product / Description</th>
            <th className="py-2 px-2 text-center w-16">HSN/SAC</th>
            <th className="py-2 px-2 text-center w-12">Qty</th>
            <th className="py-2 px-3 text-right w-20">Unit Price</th>
            <th className="py-2 px-2 text-right w-16">Discount</th>
            <th className="py-2 px-2 text-center w-14">GST %</th>
            <th className="py-2 px-3 text-right w-24">Total Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-xs">
          {sale.items?.map((item, idx) => {
            const serials = item.serialNumbersJson ? JSON.parse(item.serialNumbersJson) : [];
            const isEven = idx % 2 === 0;

            return (
              <tr key={idx} className={isEven ? 'bg-white' : 'bg-slate-50/70'}>
                <td className="py-2 px-2.5 text-center font-bold text-slate-500">{idx + 1}</td>
                <td className="py-2 px-3 font-semibold text-slate-900">
                  <div>{item.productName}</div>
                  {serials.length > 0 && (
                    <div className="text-[10px] text-orange-600 font-normal mt-0.5">
                      Chassis/Serial: {serials.join(', ')}
                    </div>
                  )}
                </td>
                <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">{item.hsnCode || '8711'}</td>
                <td className="py-2 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                <td className="py-2 px-3 text-right font-medium">₹ {item.unitPrice.toFixed(2)}</td>
                <td className="py-2 px-2 text-right text-slate-500">₹ {(item.discount || 0).toFixed(2)}</td>
                <td className="py-2 px-2 text-center text-slate-600 font-medium">{item.gstRate}%</td>
                <td className="py-2 px-3 text-right font-bold text-slate-900">₹ {item.totalPrice.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 4. TOTAL SECTION & WORDS */}
      <div className="grid grid-cols-12 border-x border-b border-slate-300 divide-x divide-slate-300">
        {/* Left: Amount In Words & Warranty Info */}
        <div className="col-span-7 p-3.5 space-y-3 bg-slate-50/60">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Amount In Words:
            </p>
            <p className="font-bold text-slate-900 text-xs mt-0.5">
              {numberToIndianWords(sale.grandTotal)}
            </p>
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1 text-[10.5px]">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Warranty & After-Sales Support:
            </p>
            <p className="text-slate-600">
              • <strong>Battery & Motor:</strong> 1-Year / 2-Year Manufacturer Warranty as applicable.
            </p>
            <p className="text-slate-600">
              • <strong>Free 1st Service:</strong> Eligible at 500 KM / 30 Days from date of purchase.
            </p>
            <p className="text-slate-600">
              • <strong>Helpline:</strong> +91 9890256419 | <strong>Email:</strong> deepebiketoy@gmail.com
            </p>
            <p className="text-slate-500 text-[10px]">
              • <strong>Payment Reconciled:</strong> {sale.paymentMethod} (Received: ₹{sale.amountReceived.toFixed(2)}, Change: ₹{sale.changeAmount.toFixed(2)})
            </p>
          </div>
        </div>

        {/* Right: Calculations Breakdown */}
        <div className="col-span-5 p-3.5 space-y-1.5 text-xs bg-white">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span className="font-semibold">₹ {sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-rose-600">
              <span>Product Discount:</span>
              <span className="font-semibold">- ₹ {sale.discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Taxable Amount:</span>
            <span className="font-semibold">₹ {taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>CGST (Central Tax):</span>
            <span className="font-semibold">₹ {halfTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>SGST (State Tax):</span>
            <span className="font-semibold">₹ {halfTax.toFixed(2)}</span>
          </div>

          <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-center text-sm font-black bg-slate-900 text-white p-2 rounded -mx-1">
            <span>GRAND TOTAL:</span>
            <span className="text-base text-orange-400">₹ {sale.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 5. TERMS & CONDITIONS */}
      <div className="p-3 border-x border-b border-slate-300 bg-slate-50/40 text-[10px] text-slate-500 space-y-0.5">
        <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Terms & Conditions:</p>
        <p>1. Goods once sold are covered under respective manufacturer warranty terms & service policy.</p>
        <p>2. Please preserve this original tax invoice for all future warranty claims, battery replacements, and free service.</p>
        <p>3. Electrical parts damaged due to physical impact, water ingress, or unauthorized tampering are not covered under free warranty.</p>
      </div>

      {/* 6. SIGNATURES */}
      <div className="grid grid-cols-2 border-x border-b border-slate-300 p-6 pt-10 text-center text-xs">
        <div>
          <div className="w-48 mx-auto border-t border-slate-400 pt-1">
            <p className="font-medium text-slate-700">Customer's Signature</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-900 uppercase">For DEEP E-BIKE & TOY</p>
          <div className="w-48 mx-auto border-t border-slate-400 pt-1 mt-7">
            <p className="font-bold text-slate-900">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* 7. THANK YOU FOOTER */}
      <div className="bg-slate-950 text-white text-center py-2.5 rounded-b-xl border-t-2 border-orange-500 font-bold text-xs tracking-wide">
        Thank You for Choosing DEEP E-BIKE & TOY! Drive Green, Save Future.
      </div>
    </div>
  );
};
