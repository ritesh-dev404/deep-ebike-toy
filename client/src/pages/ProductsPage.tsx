import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api/client';
import { Product, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  AlertTriangle,
  Hash,
  Barcode,
  Check,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingSerials, setViewingSerials] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    productCode: '',
    name: '',
    categoryId: '',
    brand: '',
    modelNumber: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    gstRate: '5',
    availableQuantity: '0',
    minStockLevel: '3',
    description: '',
    isSerialTracked: false,
    initialSerials: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, filterLowStock]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let url = `/products?categoryId=${selectedCategory}`;
      if (filterLowStock) url += '&lowStock=true';
      const res = await api.get(url);
      if (res.data.success) setProducts(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/products/export/excel`, '_blank');
  };

  const handleOpenAddModal = () => {
    setFormData({
      productCode: `DEB-${Date.now().toString().slice(-4)}`,
      name: '',
      categoryId: categories[0]?.id || '',
      brand: '',
      modelNumber: '',
      barcode: '',
      purchasePrice: '',
      sellingPrice: '',
      gstRate: '5',
      availableQuantity: '0',
      minStockLevel: '3',
      description: '',
      isSerialTracked: false,
      initialSerials: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      productCode: p.productCode,
      name: p.name,
      categoryId: p.categoryId,
      brand: p.brand || '',
      modelNumber: p.modelNumber || '',
      barcode: p.barcode || '',
      purchasePrice: p.purchasePrice !== undefined ? String(p.purchasePrice) : '',
      sellingPrice: String(p.sellingPrice),
      gstRate: String(p.gstRate),
      availableQuantity: String(p.availableQuantity),
      minStockLevel: String(p.minStockLevel),
      description: p.description || '',
      isSerialTracked: p.isSerialTracked,
      initialSerials: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, {
          ...formData,
          purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
          sellingPrice: parseFloat(formData.sellingPrice),
          gstRate: parseFloat(formData.gstRate),
          minStockLevel: parseInt(formData.minStockLevel, 10),
        });
        setEditingProduct(null);
      } else {
        const serialArray = formData.initialSerials
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);

        await api.post('/products', {
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice || '0'),
          sellingPrice: parseFloat(formData.sellingPrice),
          gstRate: parseFloat(formData.gstRate),
          availableQuantity: parseInt(formData.availableQuantity, 10),
          minStockLevel: parseInt(formData.minStockLevel, 10),
          serialNumbers: serialArray,
        });
        setShowAddModal(false);
      }
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate / delete "${name}"?`)) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.productCode.toLowerCase().includes(q) ||
      p.barcode?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Product & Inventory Catalog
          </h2>
          <p className="text-xs text-slate-500">
            Manage electric vehicles, scooters, toys, spare parts, and pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-navy-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {isOwner && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, brand, or barcode..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              filterLowStock
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300'
                : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">SKU / Code</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Brand / Model</th>
                <th className="py-3 px-4">Barcode</th>
                {isOwner && <th className="py-3 px-4 text-right">Cost Price</th>}
                <th className="py-3 px-4 text-right">Selling Price</th>
                <th className="py-3 px-4 text-center">GST %</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isOwner && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No products found matching filters
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.availableQuantity <= 0;
                  const isLow = !isOutOfStock && p.availableQuantity <= p.minStockLevel;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {p.productCode}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white max-w-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.isSerialTracked && (
                            <button
                              onClick={() => setViewingSerials(p)}
                              title="Click to view serial & chassis numbers"
                              className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold"
                            >
                              <Hash className="w-3 h-3 inline" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {p.category?.name || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {p.brand ? `${p.brand} (${p.modelNumber || '-'})` : '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {p.barcode || '-'}
                      </td>
                      {isOwner && (
                        <td className="py-3.5 px-4 text-right font-medium text-slate-500">
                          ₹ {p.purchasePrice?.toLocaleString() ?? '-'}
                        </td>
                      )}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        ₹ {p.sellingPrice.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-500">
                        {p.gstRate}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                              : isLow
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}
                        >
                          {p.availableQuantity} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            p.status === 'ACTIVE'
                              ? 'success'
                              : p.status === 'OUT_OF_STOCK'
                              ? 'danger'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      {isOwner && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Product Code / SKU</label>
                <input
                  type="text"
                  required
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Barcode</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or type barcode"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. SpeedVolt Falcon S1 High-Speed Scooter"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Deep EV"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Model Number</label>
                <input
                  type="text"
                  value={formData.modelNumber}
                  onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                  placeholder="e.g. SV-FS1"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Purchase Cost (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Selling Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">GST Rate (%)</label>
                <select
                  value={formData.gstRate}
                  onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                >
                  <option value="0">0%</option>
                  <option value="5">5% (E-Bikes / Scooters)</option>
                  <option value="12">12% (Regular Toys)</option>
                  <option value="18">18% (Kids Cars & Spares)</option>
                  <option value="28">28%</option>
                </select>
              </div>

              {!editingProduct && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Opening Qty</label>
                  <input
                    type="number"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({ ...formData, availableQuantity: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-navy-900 rounded-xl">
              <input
                type="checkbox"
                id="isSerialTracked"
                checked={formData.isSerialTracked}
                onChange={(e) => setFormData({ ...formData, isSerialTracked: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <label htmlFor="isSerialTracked" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Track individual chassis and serial numbers (Recommended for E-Bikes, Scooters, and Ride-On Cars)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md"
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Serials Modal */}
      {viewingSerials && (
        <Modal
          isOpen={true}
          onClose={() => setViewingSerials(null)}
          title={`Chassis & Serial Numbers: ${viewingSerials.name}`}
          maxWidth="lg"
        >
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Total {viewingSerials.serialNumbers?.length || 0} unit(s) currently registered in stock.
            </p>
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {viewingSerials.serialNumbers?.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                      {s.serialNumber}
                    </p>
                    {s.chassisNumber && (
                      <p className="text-[10px] text-slate-400">Chassis: {s.chassisNumber}</p>
                    )}
                  </div>
                  <Badge variant={s.status === 'AVAILABLE' ? 'success' : 'neutral'} size="sm">
                    {s.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
