import React from 'react';
import { Sale } from '../../types';

interface ThermalReceiptProps {
  sale: Sale;
}

export const ThermalReceipt: React.FC<ThermalReceiptProps> = ({ sale }) => {
  return (
    <div
      id="printable-receipt"
      className="p-4 bg-white text-black font-mono text-xs max-w-[80mm] mx-auto border border-dashed border-gray-400"
    >
      {/* Header */}
      <div className="text-center pb-2 border-b border-black">
        <h2 className="text-base font-black uppercase tracking-wider">DEEP E-BIKE & TOY</h2>
        <p className="text-[10px]">Electric Bikes, Scooters & Toys</p>
        <p className="text-[10px]">Shop 12-14, Green Park Main Road</p>
        <p className="text-[10px]">Phone: +91 98765 43210</p>
        <p className="text-[10px]">GSTIN: 27ABCDE1234F1Z5</p>
      </div>

      {/* Invoice Meta */}
      <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
        <div className="flex justify-between">
          <span>Inv: {sale.invoiceNumber}</span>
          <span>{new Date(sale.saleDate).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Cust: {sale.customer?.name || sale.customerName || 'Walk-in Customer'}</span>
          <span>{new Date(sale.saleDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {sale.customerPhone && <div>Mob: {sale.customerPhone}</div>}
      </div>

      {/* Items Table */}
      <table className="w-full my-2 text-left border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">Item</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Amt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-gray-400">
          {sale.items?.map((item, idx) => {
            const serials = item.serialNumbersJson ? JSON.parse(item.serialNumbersJson) : [];
            return (
              <React.Fragment key={idx}>
                <tr>
                  <td className="py-1 pr-1 font-semibold">{item.productName}</td>
                  <td className="py-1 text-center">{item.quantity}</td>
                  <td className="py-1 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="py-1 text-right">{item.totalPrice.toFixed(2)}</td>
                </tr>
                {serials.length > 0 && (
                  <tr>
                    <td colSpan={4} className="text-[9px] text-gray-700 italic pb-1">
                      SN: {serials.join(', ')}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Totals Summary */}
      <div className="pt-2 border-t border-black space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹ {sale.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST Tax:</span>
          <span>₹ {sale.taxAmount.toFixed(2)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>- ₹ {sale.discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-black border-t border-black pt-1">
          <span>GRAND TOTAL:</span>
          <span>₹ {sale.grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[11px] pt-1">
          <span>Pay Mode: {sale.paymentMethod}</span>
          <span>Recvd: ₹ {sale.amountReceived.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[11px]">
          <span>Change Returned:</span>
          <span>₹ {sale.changeAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-dashed border-black mt-3 text-[10px]">
        <p className="font-bold">Thank You For Your Business!</p>
        <p>No exchange without original bill.</p>
        <p className="text-[8px] text-gray-500 mt-1">Software by DEEP E-BIKE & TOY POS</p>
      </div>
    </div>
  );
};
