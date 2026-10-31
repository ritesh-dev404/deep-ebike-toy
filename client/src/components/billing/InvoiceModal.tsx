import React, { useState } from 'react';
import { Sale } from '../../types';
import { Modal } from '../common/Modal';
import { ThermalReceipt } from './ThermalReceipt';
import { Printer, Download, CheckCircle, FileText } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  const [format, setFormat] = useState<'a4' | 'thermal'>('thermal');

  if (!sale) return null;

  const handlePrintThermal = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(`/api/billing/${sale.id}/pdf`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${sale.invoiceNumber}`} maxWidth="2xl">
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold">Transaction Successfully Completed!</span>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
            {sale.paymentMethod}
          </span>
        </div>

        {/* Format Toggle Bar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-navy-900">
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('thermal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'thermal'
                  ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              80mm Thermal Receipt
            </button>
            <button
              onClick={() => setFormat('a4')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'a4'
                  ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Standard A4 Tax Invoice
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrintThermal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF A4</span>
            </button>
          </div>
        </div>

        {/* Preview Container */}
        <div className="bg-slate-100 dark:bg-navy-900 p-4 rounded-xl max-h-[60vh] overflow-y-auto flex justify-center">
          {format === 'thermal' ? (
            <ThermalReceipt sale={sale} />
          ) : (
            <div className="w-full bg-white text-slate-900 p-6 rounded-lg shadow font-sans text-xs space-y-4 max-w-lg">
              <div className="flex justify-between border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">DEEP E-BIKE & TOY</h3>
                  <p className="text-[11px] text-slate-500">Shop No. 12-14, Green Park Main Road</p>
                  <p className="text-[11px] text-slate-500">Ph: +91 98765 43210</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-slate-800">TAX INVOICE</span>
                  <p className="text-[11px] text-slate-500">{sale.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-500">{new Date(sale.saleDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex justify-between text-[11px] text-slate-600">
                <div>
                  <span className="font-bold text-slate-800">Billed To:</span>
                  <p>{sale.customer?.name || sale.customerName || 'Walk-in Customer'}</p>
                  <p>{sale.customerPhone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">Payment:</span>
                  <p>{sale.paymentMethod}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-y bg-slate-50 font-bold text-slate-700">
                    <th className="py-1.5 px-1">Item</th>
                    <th className="py-1.5 px-1 text-center">Qty</th>
                    <th className="py-1.5 px-1 text-right">Rate</th>
                    <th className="py-1.5 px-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sale.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 px-1">{item.productName}</td>
                      <td className="py-1.5 px-1 text-center">{item.quantity}</td>
                      <td className="py-1.5 px-1 text-right">₹ {item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 px-1 text-right">₹ {item.totalPrice.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-2 space-y-1 text-right text-xs">
                <p>Subtotal: ₹ {sale.subtotal.toFixed(2)}</p>
                <p>Tax (GST): ₹ {sale.taxAmount.toFixed(2)}</p>
                <p className="font-black text-sm text-slate-900">Grand Total: ₹ {sale.grandTotal.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
