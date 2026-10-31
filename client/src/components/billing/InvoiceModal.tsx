import React, { useState } from 'react';
import { Sale } from '../../types';
import { Modal } from '../common/Modal';
import { ThermalReceipt } from './ThermalReceipt';
import { A4Invoice } from './A4Invoice';
import { Printer, Download, CheckCircle, FileText } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, isOpen, onClose }) => {
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4');

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(`/api/billing/${sale.id}/pdf`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Invoice #${sale.invoiceNumber}`} maxWidth="4xl">
      <div className="space-y-4">
        {/* Success Banner */}
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-bold">Bill Generated Successfully!</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              Payment: {sale.paymentMethod}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 dark:bg-navy-800 dark:text-slate-200 font-mono">
              ₹ {sale.grandTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Format Selector & Actions Bar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-navy-900">
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('a4')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'a4'
                  ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Standard A4 Tax Invoice
            </button>
            <button
              onClick={() => setFormat('thermal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'thermal'
                  ? 'bg-white dark:bg-navy-800 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              80mm Thermal Receipt
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice (A4 / Roll)</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="bg-slate-100 dark:bg-navy-900 p-4 rounded-xl max-h-[70vh] overflow-y-auto">
          {format === 'a4' ? (
            <A4Invoice sale={sale} />
          ) : (
            <div className="flex justify-center">
              <ThermalReceipt sale={sale} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
