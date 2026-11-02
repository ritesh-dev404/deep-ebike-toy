import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api/client';
import { Sale } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { InvoiceModal } from '../components/billing/InvoiceModal';
import { Modal } from '../components/common/Modal';
import {
  BarChart3,
  Search,
  Download,
  Eye,
  XCircle,
  FileText,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // View Invoice Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Cancel Modal
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [statusFilter, paymentFilter]);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      let url = `/billing?status=${statusFilter}&paymentMethod=${paymentFilter}`;
      const res = await api.get(url);
      if (res.data.success) setSales(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/reports/export/sales-excel`, '_blank');
  };

  const handleOpenInvoice = async (id: string) => {
    try {
      const res = await api.get(`/billing/${id}`);
      if (res.data.success) {
        setSelectedSale(res.data.data);
        setShowInvoiceModal(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch invoice details');
    }
  };

  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel || !cancelReason.trim()) return;

    setIsCancelling(true);
    try {
      await api.post(`/billing/${saleToCancel.id}/cancel`, {
        reason: cancelReason.trim(),
      });
      setSaleToCancel(null);
      setCancelReason('');
      fetchSales();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel invoice');
    } finally {
      setIsCancelling(false);
    }
  };

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.customerName?.toLowerCase().includes(q) ||
      s.customerPhone?.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Sales Ledger & Invoicing Reports
          </h2>
          <p className="text-xs text-slate-500">
            View completed transactions, reprint receipts, or process authorized cancellations
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Sales Ledger (.xlsx)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice number, customer name or phone..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-navy-900 border rounded-xl"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-navy-900 border rounded-xl"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI / QR</option>
            <option value="CARD">Card</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {s.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(s.saleDate).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {s.customer?.name || s.customerName || 'Walk-in'}
                    </p>
                    {s.customerPhone && (
                      <p className="text-[10px] text-slate-400">{s.customerPhone}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold">
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-300">
                    ₹ {s.subtotal.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500">
                    ₹ {s.taxAmount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900 dark:text-white">
                    ₹ {s.grandTotal.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={s.status === 'COMPLETED' ? 'success' : 'danger'} size="sm">
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {s.createdBy?.fullName}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenInvoice(s.id)}
                        title="View / Reprint Invoice"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {isOwner && s.status === 'COMPLETED' && (
                        <button
                          onClick={() => setSaleToCancel(s)}
                          title="Cancel Invoice & Restore Stock"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Viewer Modal */}
      <InvoiceModal
        sale={selectedSale}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />

      {/* Cancel Bill Modal */}
      {saleToCancel && (
        <Modal
          isOpen={true}
          onClose={() => setSaleToCancel(null)}
          title={`Cancel Invoice #${saleToCancel.invoiceNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmCancel} className="space-y-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Cancelling this invoice will immediately restore all inventory items and release any attached serial/chassis numbers back to stock.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">
                Cancellation Reason (Mandatory)
              </label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer changed mind, accidental duplicate bill, returned item..."
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setSaleToCancel(null)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isCancelling ? 'Processing...' : 'Confirm Cancellation & Restore Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
