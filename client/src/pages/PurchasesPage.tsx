import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Purchase, Supplier, Product } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Truck,
  Plus,
  Search,
  Building,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  CheckCircle,
  FileText,
} from 'lucide-react';

export const PurchasesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'suppliers'>('invoices');
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
  });

  // Purchase Form
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    invoiceNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    paidAmount: '',
    notes: '',
    items: [
      {
        productId: '',
        quantity: 1,
        unitPurchasePrice: 0,
        gstRate: 5,
        serialNumbers: '',
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/suppliers'),
        api.get('/products'),
      ]);
      if (purRes.data.success) setPurchases(purRes.data.data);
      if (supRes.data.success) setSuppliers(supRes.data.data);
      if (prodRes.data.success) setProducts(prodRes.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPurchaseItem = () => {
    setPurchaseForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: '',
          quantity: 1,
          unitPurchasePrice: 0,
          gstRate: 5,
          serialNumbers: '',
        },
      ],
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setPurchaseForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          items[index].unitPurchasePrice = prod.purchasePrice || 0;
          items[index].gstRate = prod.gstRate || 0;
        }
      }
      return { ...prev, items };
    });
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/suppliers', supplierForm);
      setShowSupplierModal(false);
      setSupplierForm({ name: '', contactPerson: '', phone: '', email: '', address: '', gstNumber: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create supplier');
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedItems = purchaseForm.items.map((item) => ({
        productId: item.productId,
        quantity: parseInt(String(item.quantity), 10),
        unitPurchasePrice: parseFloat(String(item.unitPurchasePrice)),
        gstRate: parseFloat(String(item.gstRate)),
        serialNumbers: item.serialNumbers
          ? item.serialNumbers.split('\n').map((s) => s.trim()).filter(Boolean)
          : undefined,
      }));

      await api.post('/purchases', {
        supplierId: purchaseForm.supplierId,
        invoiceNumber: purchaseForm.invoiceNumber,
        purchaseDate: purchaseForm.purchaseDate,
        paidAmount: purchaseForm.paidAmount ? parseFloat(purchaseForm.paidAmount) : undefined,
        notes: purchaseForm.notes,
        items: formattedItems,
      });

      setShowPurchaseModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to record purchase');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Purchases & Supplier Management
          </h2>
          <p className="text-xs text-slate-500">
            Record incoming stock shipments and manage vendor payables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Stock-In Purchase</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices'
              ? 'bg-navy-900 text-white dark:bg-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Purchase Invoices
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-navy-900 text-white dark:bg-orange-600 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
          }`}
        >
          Suppliers Directory ({suppliers.length})
        </button>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Items Count</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-right">Paid Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(p.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {p.supplier?.name}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {p.items?.length || 0} line(s)
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹ {p.grandTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600 dark:text-slate-300">
                      ₹ {p.paidAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge
                        variant={p.paymentStatus === 'PAID' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {p.paymentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {p.createdBy?.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-5 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h4>
                <Badge variant={s.outstandingBalance > 0 ? 'warning' : 'success'} size="sm">
                  {s.outstandingBalance > 0 ? `Payable: ₹${s.outstandingBalance}` : 'Settled'}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-slate-500">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{s.phone}</span>
                </p>
                {s.contactPerson && (
                  <p>
                    <span className="font-semibold">Contact:</span> {s.contactPerson}
                  </p>
                )}
                {s.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{s.email}</span>
                  </p>
                )}
                {s.gstNumber && (
                  <p>
                    <span className="font-semibold">GSTIN:</span> {s.gstNumber}
                  </p>
                )}
                {s.address && <p className="text-[11px] pt-1">{s.address}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Purchase Modal */}
      {showPurchaseModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowPurchaseModal(false)}
          title="Record Stock-In Purchase Receipt"
          maxWidth="3xl"
        >
          <form onSubmit={handleCreatePurchase} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Supplier</label>
                <select
                  required
                  value={purchaseForm.supplierId}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Vendor Invoice #</label>
                <input
                  type="text"
                  required
                  value={purchaseForm.invoiceNumber}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceNumber: e.target.value })}
                  placeholder="e.g. VLT-2026-99"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Invoice Date</label>
                <input
                  type="date"
                  required
                  value={purchaseForm.purchaseDate}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Received Line Items
                </span>
                <button
                  type="button"
                  onClick={handleAddPurchaseItem}
                  className="text-xs font-bold text-orange-600 hover:text-orange-500 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Another Item
                </button>
              </div>

              {purchaseForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-navy-900 border rounded-xl space-y-2 text-xs"
                >
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Product</label>
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white dark:bg-navy-800 border rounded-lg"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qty</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white dark:bg-navy-800 border rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Unit Cost (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={item.unitPurchasePrice}
                        onChange={(e) => handleItemChange(idx, 'unitPurchasePrice', e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 text-xs bg-white dark:bg-navy-800 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Serial numbers input if vehicle */}
                  <div>
                    <label className="text-[10px] font-bold text-orange-500 uppercase">
                      Chassis / Serial Numbers (One per line, optional):
                    </label>
                    <textarea
                      rows={2}
                      value={item.serialNumbers}
                      onChange={(e) => handleItemChange(idx, 'serialNumbers', e.target.value)}
                      placeholder="e.g. DEB-001-SN991&#10;DEB-001-SN992"
                      className="w-full mt-1 px-2 py-1 text-xs bg-white dark:bg-navy-800 border rounded-lg font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowPurchaseModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md"
              >
                Confirm Stock-In & Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowSupplierModal(false)}
          title="Add New Supplier"
          maxWidth="md"
        >
          <form onSubmit={handleCreateSupplier} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Company Name</label>
              <input
                type="text"
                required
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Contact Person</label>
                <input
                  type="text"
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                <input
                  type="text"
                  required
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">GSTIN (Optional)</label>
              <input
                type="text"
                value={supplierForm.gstNumber}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstNumber: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
              >
                Save Supplier
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
