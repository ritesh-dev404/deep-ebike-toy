import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { Product, Sale } from '../types';
import { InvoiceModal } from '../components/billing/InvoiceModal';
import { numberToIndianWords } from '../utils/numberToWords';
import {
  Plus,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  User,
  Phone,
  MapPin,
  CreditCard,
  QrCode,
  Banknote,
  Tag,
  Zap,
  ShoppingBag,
  Clock,
  Calendar,
} from 'lucide-react';

interface BillItem {
  id: string;
  productId?: string;
  name: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  discount: number;
  totalPrice: number;
  hsnCode?: string;
}

export const PosPage: React.FC = () => {
  // Ultra-simple inputs
  const [productNameInput, setProductNameInput] = useState<string>('');
  const [priceInput, setPriceInput] = useState<string>('');
  const [gstRateInput, setGstRateInput] = useState<number>(5);

  // Optional customer details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Bill items list
  const [items, setItems] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live Catalog for smart suggestions
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Completed invoice modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  const productNameRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data.success) {
        setCatalog(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load catalog:', e);
    }
  };

  const handleProductNameChange = (value: string) => {
    setProductNameInput(value);
    if (value.trim().length > 1) {
      const matches = catalog.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase()) ||
        p.productCode.toLowerCase().includes(value.toLowerCase()) ||
        p.barcode?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(matches.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (prod: Product) => {
    setProductNameInput(prod.name);
    setPriceInput(String(prod.sellingPrice));
    setGstRateInput(prod.gstRate || 5);
    setShowSuggestions(false);
    priceInputRef.current?.focus();
  };

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!productNameInput.trim()) {
      setError('Please enter a product name');
      productNameRef.current?.focus();
      return;
    }

    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid selling price');
      priceInputRef.current?.focus();
      return;
    }

    // Check if matched in catalog
    const matchedProd = catalog.find(
      (p) => p.name.toLowerCase() === productNameInput.trim().toLowerCase()
    );

    const newItem: BillItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      productId: matchedProd?.id,
      name: productNameInput.trim(),
      unitPrice: price,
      quantity: 1, // Default quantity 1
      gstRate: matchedProd?.gstRate || gstRateInput,
      discount: 0,
      totalPrice: price,
      hsnCode: matchedProd?.brand ? '8711' : '9503',
    };

    setItems((prev) => [...prev, newItem]);
    setProductNameInput('');
    setPriceInput('');
    setError(null);
    setShowSuggestions(false);
    productNameRef.current?.focus();
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(1, item.quantity + delta);
            return {
              ...item,
              quantity: newQty,
              totalPrice: newQty * item.unitPrice - item.discount,
            };
          }
          return item;
        })
        .filter((i) => i.quantity > 0)
    );
  };

  const handleUpdatePrice = (id: string, newPrice: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            unitPrice: newPrice,
            totalPrice: item.quantity * newPrice - item.discount,
          };
        }
        return item;
      })
    );
  };

  const clearBill = () => {
    setItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setAmountReceived('');
    setError(null);
  };

  // Real-time automatic calculations
  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalTax = items.reduce((sum, item) => {
    const tax = (item.totalPrice * item.gstRate) / (100 + item.gstRate);
    return sum + tax;
  }, 0);
  const subtotal = grandTotal;
  const taxableAmount = Math.max(0, grandTotal - totalTax);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const receivedNum = parseFloat(amountReceived) || grandTotal;
  const changeDue = Math.max(0, receivedNum - grandTotal);

  const handleGenerateBill = async () => {
    if (items.length === 0) {
      setError('Please add at least one product to generate the bill.');
      productNameRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        paymentMethod,
        amountReceived: receivedNum,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          gstRate: i.gstRate,
          discount: i.discount,
          hsnCode: i.hsnCode,
        })),
      };

      const res = await api.post('/billing', payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setShowInvoiceModal(true);
        clearBill();
        fetchProducts(); // Refresh stock
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. TOP HEADER & STORE IDENTITY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-950 via-navy-900 to-slate-900 text-white rounded-2xl shadow-md border-b-2 border-orange-500">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/40">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-wider uppercase">DEEP E-BIKE & TOY</h2>
              <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">
                Sales | Service | Accessories
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-300 pt-1">
            Shop No. 12-14, Green Park Main Road, City Center • Mobile: <strong className="text-white">9890256419</strong> • Email: <strong className="text-white">deepebiketoy@gmail.com</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-xl text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Date & Time</p>
            <p className="text-xs font-mono font-bold text-orange-400">
              {new Date().toLocaleDateString('en-IN')} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. SIMPLE BILLING INPUT SECTION (Only Product Name & Price required) */}
      <div className="p-5 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-orange-500 font-black" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
              Fast Add Product to Bill
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Quantity defaults to 1 • Automatic GST & Total Calculation
          </span>
        </div>

        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Product Name Input */}
          <div className="md:col-span-6 relative">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Product Name <span className="text-orange-500">*</span>
            </label>
            <input
              ref={productNameRef}
              type="text"
              required
              value={productNameInput}
              onChange={(e) => handleProductNameChange(e.target.value)}
              placeholder="Enter product name (e.g. Deep Thunder Pro E-Bike 250W, Kids Mercedes Car...)"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />

            {/* Smart Autocomplete Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {filteredSuggestions.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectSuggestion(prod)}
                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-navy-900 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{prod.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {prod.productCode} • {prod.category?.name} • Stock: {prod.availableQuantity}
                      </p>
                    </div>
                    <span className="font-extrabold text-orange-600 dark:text-orange-400">
                      ₹ {prod.sellingPrice.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Price Input */}
          <div className="md:col-span-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Price (₹) <span className="text-orange-500">*</span>
            </label>
            <input
              ref={priceInputRef}
              type="number"
              step="0.01"
              required
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="e.g. 38500"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 font-mono font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* GST % */}
          <div className="md:col-span-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              GST %
            </label>
            <select
              value={gstRateInput}
              onChange={(e) => setGstRateInput(parseFloat(e.target.value))}
              className="w-full px-2 py-2.5 text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:outline-none"
            >
              <option value="5">5%</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="0">0%</option>
            </select>
          </div>

          {/* Add Product Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. OPTIONAL CUSTOMER DETAILS (Customer Name, Mobile, Address) */}
      <div className="p-4 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Customer Details (Optional)
            </h4>
          </div>
          <span className="text-[10px] text-slate-400">
            Leave blank if not provided; bill will generate as "Walk-in Retail Customer"
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name (Optional)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
            />
          </div>

          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Mobile Number (Optional)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
            />
          </div>

          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Address (Optional)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* 4. CURRENT BILL ITEMS TABLE */}
      <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-900/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Invoice Items ({items.length})
            </h3>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearBill}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
            >
              Clear All Items
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShoppingBag className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700" />
            <p className="font-semibold text-sm">No items added to current bill</p>
            <p className="text-xs">
              Type Product Name & Price above and click <strong>Add Product</strong>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-navy-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-center w-12">Sr.</th>
                  <th className="py-2.5 px-4">Product / Description</th>
                  <th className="py-2.5 px-3 text-center w-24">HSN Code</th>
                  <th className="py-2.5 px-3 text-center w-28">Qty</th>
                  <th className="py-2.5 px-4 text-right w-28">Unit Price (₹)</th>
                  <th className="py-2.5 px-3 text-center w-20">GST %</th>
                  <th className="py-2.5 px-4 text-right w-32">Total Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center w-14">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                    <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {item.hsnCode || '8711'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-slate-900 dark:text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-right text-xs bg-slate-50 dark:bg-navy-900 border rounded font-mono font-bold"
                      />
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {item.gstRate}%
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                      ₹ {item.totalPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. TOTAL SECTION & CHECKOUT */}
      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Amount in Words & Payment Method */}
          <div className="md:col-span-7 bg-white dark:bg-navy-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Amount In Words:
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {numberToIndianWords(grandTotal)}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Select Payment Method:
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'OTHER', label: 'Other', icon: Tag },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-orange-600 text-white border-orange-600 font-bold shadow-md shadow-orange-600/30'
                          : 'bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Received & Change */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Received (₹)</label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder={grandTotal ? grandTotal.toFixed(2) : '0.00'}
                  className="w-full mt-1 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Change Due (₹)</label>
                <div className="mt-1 px-3 py-2 text-xs font-bold bg-slate-100 dark:bg-navy-900 rounded-xl text-emerald-600 dark:text-emerald-400">
                  ₹ {changeDue.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Breakdown & Big Generate Button */}
          <div className="md:col-span-5 bg-white dark:bg-navy-850 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Taxable Amount:</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹ {taxableAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>CGST (Central Tax):</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹ {cgst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>SGST (State Tax):</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹ {sgst.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 dark:text-white">GRAND TOTAL</span>
                <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
                  ₹ {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleGenerateBill}
              disabled={isSubmitting}
              className="w-full mt-4 py-4 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm tracking-wider uppercase shadow-xl shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Generating Invoice...</span>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>GENERATE BILL (₹ {grandTotal.toLocaleString()})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Invoice Viewer Modal */}
      <InvoiceModal
        sale={completedSale}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};
