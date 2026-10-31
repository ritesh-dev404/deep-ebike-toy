import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { StockMovement, Product } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Sliders,
  Search,
  Hash,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const StockPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movements' | 'serials'>('movements');
  const [overview, setOverview] = useState<any>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [serials, setSerials] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    adjustmentType: 'ADD',
    quantity: '1',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, [movementFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [overRes, moveRes, serRes, prodRes] = await Promise.all([
        api.get('/stock/overview'),
        api.get(`/stock/movements?movementType=${movementFilter}`),
        api.get('/stock/serial-numbers'),
        api.get('/products'),
      ]);
      if (overRes.data.success) setOverview(overRes.data.data);
      if (moveRes.data.success) setMovements(moveRes.data.data);
      if (serRes.data.success) setSerials(serRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/stock/adjust', {
        productId: adjustForm.productId,
        adjustmentType: adjustForm.adjustmentType,
        quantity: parseInt(adjustForm.quantity, 10),
        notes: adjustForm.notes,
      });
      setShowAdjustModal(false);
      setAdjustForm({ productId: '', adjustmentType: 'ADD', quantity: '1', notes: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to adjust stock');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Stock & Inventory Auditing
          </h2>
          <p className="text-xs text-slate-500">
            Track inward purchases, outward POS sales, and chassis/serial history
          </p>
        </div>

        <button
          onClick={() => setShowAdjustModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-white dark:bg-orange-600 dark:hover:bg-orange-500 text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Manual Stock Adjustment</span>
        </button>
      </div>

      {/* Stock Overview Cards */}
      {overview && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Available Units</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {overview.totalStockUnits}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Inventory Value</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ₹ {overview.totalStockValue?.toLocaleString() || '-'}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Stock In</p>
            <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {overview.stockInTotal}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Sold</p>
            <p className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
              {overview.stockSoldTotal}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-navy-850 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Low Stock Alerts</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {overview.lowStockCount}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'movements'
              ? 'bg-navy-900 text-white dark:bg-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Stock Movements Ledger
        </button>
        <button
          onClick={() => setActiveTab('serials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'serials'
              ? 'bg-navy-900 text-white dark:bg-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Chassis & Serial Numbers Tracker
        </button>
      </div>

      {/* Tab 1: Movements Table */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Filter by Type:</span>
              <select
                value={movementFilter}
                onChange={(e) => setMovementFilter(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-navy-900 border rounded-lg"
              >
                <option value="ALL">All Movements</option>
                <option value="SALE">Sales Outward</option>
                <option value="PURCHASE">Supplier Inward</option>
                <option value="RETURN">Customer Returns</option>
                <option value="ADJUSTMENT_ADD">Manual Add</option>
                <option value="ADJUSTMENT_SUB">Manual Deduct</option>
              </select>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Showing {movements.length} logged events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Change Qty</th>
                  <th className="py-3 px-4 text-center">Before → After</th>
                  <th className="py-3 px-4">Notes / Reference</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {m.product.name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          m.movementType === 'PURCHASE' || m.movementType === 'ADJUSTMENT_ADD'
                            ? 'success'
                            : m.movementType === 'RETURN'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {m.movementType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {m.previousStock} → {m.newStock}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {m.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {m.createdBy.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Serials Table */}
      {activeTab === 'serials' && (
        <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Chassis Number</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Purchase Inv #</th>
                  <th className="py-3 px-4">Sold on Inv #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serials.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {s.serialNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.chassisNumber || '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {s.product.name}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={s.status === 'AVAILABLE' ? 'success' : s.status === 'SOLD' ? 'info' : 'warning'}
                        size="sm"
                      >
                        {s.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {s.purchase?.invoiceNumber || 'Opening Stock'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-orange-600">
                      {s.sale?.invoiceNumber || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Stock Adjustment Modal */}
      {showAdjustModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAdjustModal(false)}
          title="Manual Stock Adjustment"
          maxWidth="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Select Product</label>
              <select
                required
                value={adjustForm.productId}
                onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              >
                <option value="">Choose a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current Stock: {p.availableQuantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Action</label>
                <select
                  value={adjustForm.adjustmentType}
                  onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-bold"
                >
                  <option value="ADD">Add Stock (+)</option>
                  <option value="SUBTRACT">Deduct Stock (-)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Reason / Justification</label>
              <textarea
                required
                rows={2}
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder="e.g. Physical inventory count correction, damaged unit write-off..."
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md"
              >
                Submit Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
