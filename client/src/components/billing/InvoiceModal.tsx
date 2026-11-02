import React, { useState } from 'react';
import { Sale } from '../../types';
import { API_BASE_URL } from '../../api/client';
import { Modal } from '../common/Modal';
import { ThermalReceipt } from './ThermalReceipt';
import { A4Invoice } from './A4Invoice';
import {
  Printer,
  Download,
  CheckCircle,
  Maximize2,
  Minimize2,
  FileText,
  Receipt,
} from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  sale,
  isOpen,
  onClose,
}) => {
  const [format, setFormat] = useState<'a4' | 'thermal'>('a4');
  const [zoomMode, setZoomMode] = useState<'fit' | 'full'>('fit');

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.open(`${API_BASE_URL}/billing/${sale.id}/pdf`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice #${sale.invoiceNumber}`}
      maxWidth="5xl"
    >
      <div className="space-y-3 p-1">
        {/* Top Notification Bar */}
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">Bill Generated Successfully!</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono">
              #{sale.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 text-[11px]">
              {sale.paymentMethod} • {sale.paymentStatus || 'PAID'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 dark:bg-navy-800 dark:text-slate-100 font-bold font-mono text-[11px]">
              ₹ {sale.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Toolbar: Format Selector, Zoom Mode, Print & Download Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-100 dark:bg-navy-900">
          {/* Format Tabs */}
          <div className="flex gap-1.5 bg-slate-200/70 dark:bg-navy-950 p-1 rounded-lg">
            <button
              onClick={() => setFormat('a4')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                format === 'a4'
                  ? 'bg-white dark:bg-navy-800 text-[#082C50] dark:text-[#E5A823] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Standard A4 Tax Invoice</span>
            </button>
            <button
              onClick={() => setFormat('thermal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                format === 'thermal'
                  ? 'bg-white dark:bg-navy-800 text-[#082C50] dark:text-[#E5A823] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>80mm Thermal Receipt</span>
            </button>
          </div>

          {/* Action Buttons & Zoom Toggle */}
          <div className="flex items-center gap-2">
            {format === 'a4' && (
              <button
                onClick={() => setZoomMode(zoomMode === 'fit' ? 'full' : 'fit')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                title={zoomMode === 'fit' ? 'View 100% Actual Size' : 'Fit Entire Invoice to Window'}
              >
                {zoomMode === 'fit' ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>100% Size</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Fit to Window</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#082C50] hover:bg-[#0B3B6D] text-white text-xs font-bold shadow-md transition-all border border-[#0A192F]"
            >
              <Printer className="w-4 h-4 text-[#E5A823]" />
              <span>Print Invoice</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors bg-white dark:bg-navy-800"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Invoice Preview Viewport */}
        <div
          className={`bg-slate-200/60 dark:bg-navy-950 p-3 rounded-xl border border-slate-300 dark:border-slate-800 ${
            zoomMode === 'fit' && format === 'a4'
              ? 'overflow-hidden flex justify-center items-start'
              : 'overflow-y-auto max-h-[75vh]'
          }`}
        >
          {format === 'a4' ? (
            <div
              className={`transition-transform duration-200 ${
                zoomMode === 'fit'
                  ? 'origin-top scale-[0.66] sm:scale-[0.70] md:scale-[0.74] -mb-72'
                  : 'w-full flex justify-center'
              }`}
            >
              <A4Invoice sale={sale} />
            </div>
          ) : (
            <div className="flex justify-center w-full py-4">
              <ThermalReceipt sale={sale} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
