import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Customer } from '../types';
import { Modal } from '../components/common/Modal';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/customers');
      if (res.data.success) setCustomers(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '' });
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Customer Relationship Management (CRM)
          </h2>
          <p className="text-xs text-slate-500">
            View customer purchase history, spend totals, and contact directory
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', email: '', address: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or phone number..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Bills Count</th>
                <th className="py-3 px-4 text-right">Lifetime Purchases</th>
                <th className="py-3 px-4">Last Visit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {c.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {c.phone}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.email || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.address || '-'}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                    {c._count?.sales || 0}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-orange-600 dark:text-orange-400">
                    ₹ {c.totalPurchases?.toLocaleString() || '0'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString() : 'New'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Customer Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Address (Optional)</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
              >
                Save Customer
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
