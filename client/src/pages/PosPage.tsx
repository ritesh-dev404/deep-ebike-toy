import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { Product, Category, CartItem, Sale, Customer } from '../types';
import { Badge } from '../components/common/Badge';
import { InvoiceModal } from '../components/billing/InvoiceModal';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  Check,
  AlertCircle,
  Tag,
  Hash,
  Package,
} from 'lucide-react';

export const PosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerFound, setCustomerFound] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [showUpiQr, setShowUpiQr] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInitialData();

    // Global keyboard shortcuts (F2 to focus search, ESC to clear)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (e) {
      console.error('Failed to fetch POS initial catalog:', e);
    }
  };

  // Barcode / SKU instant scan handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const query = searchQuery.trim().toLowerCase();

      // Check exact barcode or productCode match first
      const exactMatch = products.find(
        (p) =>
          p.barcode?.toLowerCase() === query ||
          p.productCode?.toLowerCase() === query
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
      }
    }
  };

  const handlePhoneLookup = async (phone: string) => {
    setCustomerPhone(phone);
    if (phone.trim().length >= 10) {
      try {
        const res = await api.get(`/customers/phone/${phone.trim()}`);
        if (res.data.success && res.data.data) {
          setCustomerFound(res.data.data);
          setCustomerName(res.data.data.name);
        }
      } catch {
        setCustomerFound(null);
      }
    } else {
      setCustomerFound(null);
    }
  };

  const addToCart = (product: Product) => {
    if (product.availableQuantity <= 0) {
      setError(`"${product.name}" is OUT OF STOCK`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.availableQuantity) {
          setError(`Cannot add more than available inventory (${product.availableQuantity})`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                totalPrice: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        );
      } else {
        // First serial available if serial tracked
        const initialSerial = product.serialNumbers?.[0]?.serialNumber;
        return [
          ...prevCart,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            discount: 0,
            selectedSerials: initialSerial ? [initialSerial] : [],
            totalPrice: product.sellingPrice,
          },
        ];
      }
    });
    setError(null);
  };

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          if (newQty > item.product.availableQuantity) {
            setError(`Cannot exceed available stock of ${item.product.availableQuantity}`);
            return item;
          }
          return {
            ...item,
            quantity: newQty,
            totalPrice: newQty * item.unitPrice - item.discount,
          };
        }
        return item;
      })
    );
  };

  const updateSerial = (productId: string, serial: string, index: number) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId) {
          const updatedSerials = [...item.selectedSerials];
          updatedSerials[index] = serial;
          return { ...item, selectedSerials: updatedSerials };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setAmountReceived('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerFound(null);
    setError(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalTax = cart.reduce((sum, item) => {
    const net = item.unitPrice * item.quantity - item.discount;
    const tax = (net * item.product.gstRate) / (100 + item.product.gstRate);
    return sum + tax;
  }, 0);
  const netSubtotal = subtotal - totalTax;
  const grandTotal = Math.max(0, subtotal - discountAmount);
  const receivedNum = parseFloat(amountReceived) || 0;
  const changeAmount = Math.max(0, receivedNum - grandTotal);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === 'ALL' || p.category?.code === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Cart is empty. Please add items to generate a bill.');
      return;
    }

    // Verify serial numbers for tracked items
    for (const item of cart) {
      if (item.product.isSerialTracked) {
        if (item.selectedSerials.length !== item.quantity) {
          setError(`Please select serial numbers for "${item.product.name}"`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          serialNumbers: item.product.isSerialTracked ? item.selectedSerials : undefined,
        })),
        discountAmount,
        paymentMethod,
        amountReceived: receivedNum > 0 ? receivedNum : grandTotal,
      };

      const res = await api.post('/billing', payload);
      if (res.data.success) {
        setCompletedSale(res.data.data);
        setShowInvoiceModal(true);
        clearCart();
        fetchInitialData(); // Refresh stock counts in UI!
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Billing transaction failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-6rem)]">
      {/* LEFT: Product Catalog & Fast Search */}
      <div className="flex-1 flex flex-col bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search & Barcode Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-900/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode or type name / model... (Press Enter to quick add)"
                className="w-full pl-10 pr-24 py-2.5 bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500">
                F2
              </span>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-navy-800 text-slate-500 hidden sm:block">
              <Barcode className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.code)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.code
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-700 stroke-1 mb-2" />
              <p className="text-sm font-semibold">No products match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.availableQuantity <= 0;
                const isLowStock = !isOutOfStock && p.availableQuantity <= p.minStockLevel;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`group relative p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? 'opacity-60 bg-slate-50 dark:bg-navy-900 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-md cursor-pointer'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {p.productCode}
                        </span>
                        {p.isSerialTracked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                            Serial
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                        {p.name}
                      </h4>
                      {p.brand && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.brand}</p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <div>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          ₹ {p.sellingPrice.toLocaleString()}
                        </span>
                        <p className="text-[9px] text-slate-400">GST {p.gstRate}% incl.</p>
                      </div>

                      {/* Stock Pill */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}
                      >
                        {isOutOfStock ? '0 left' : `${p.availableQuantity} in stock`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: POS Bill & Cart Panel */}
      <div className="w-full lg:w-[440px] flex flex-col bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-navy-900/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Current Invoice ({cart.length} items)
            </h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-600 font-semibold"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="m-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-6">
              <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-700 stroke-1 mb-2" />
              <p className="text-sm font-semibold text-slate-500">Cart is Empty</p>
              <p className="text-xs text-slate-400 mt-1">
                Scan barcode or click items from catalog to start billing
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-navy-900/50 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.product.name}
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      ₹ {item.unitPrice.toLocaleString()} × {item.quantity} (GST {item.product.gstRate}%)
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Serial Selector if tracked */}
                {item.product.isSerialTracked && item.product.serialNumbers && (
                  <div className="pt-1">
                    <label className="text-[10px] font-semibold text-orange-500 uppercase flex items-center gap-1">
                      <Hash className="w-3 h-3" /> Select Chassis / Serial:
                    </label>
                    {Array.from({ length: item.quantity }).map((_, i) => (
                      <select
                        key={i}
                        value={item.selectedSerials[i] || ''}
                        onChange={(e) => updateSerial(item.product.id, e.target.value, i)}
                        className="w-full mt-1 px-2 py-1 text-xs bg-white dark:bg-navy-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        <option value="">Select Serial #{i + 1}</option>
                        {item.product.serialNumbers?.map((s) => (
                          <option key={s.id} value={s.serialNumber}>
                            {s.serialNumber} {s.chassisNumber ? `(${s.chassisNumber})` : ''}
                          </option>
                        ))}
                      </select>
                    ))}
                  </div>
                )}

                {/* Quantity Controls & Line Total */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-navy-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-navy-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    ₹ {item.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Checkout Controls */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-navy-900 space-y-3">
          {/* Customer Input (Optional) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => handlePhoneLookup(e.target.value)}
                placeholder="Mobile (Optional)"
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
          {customerFound && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              ✓ Registered Customer ({customerFound.totalPurchases ? `₹${customerFound.totalPurchases} spent` : 'Regular'})
            </p>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-1.5">
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
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'UPI') setShowUpiQr(true);
                      else setShowUpiQr(false);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm font-bold'
                        : 'bg-white dark:bg-navy-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px]">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated UPI QR Preview if UPI selected */}
          {showUpiQr && (
            <div className="p-3 bg-white dark:bg-navy-850 rounded-xl border border-orange-200 dark:border-orange-800 text-center">
              <p className="text-xs font-bold text-orange-600 dark:text-orange-400">
                DEEP E-BIKE UPI QR CODE
              </p>
              <div className="w-24 h-24 mx-auto my-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-800 dark:text-slate-200" />
              </div>
              <p className="text-[10px] text-slate-500 font-mono">deep.ebike@okicici</p>
            </div>
          )}

          {/* Amount Received & Change */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Received (₹)</label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder={grandTotal ? grandTotal.toFixed(2) : '0.00'}
                className="w-full mt-1 px-3 py-1.5 text-xs font-bold bg-white dark:bg-navy-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Change Due (₹)</label>
              <div className="mt-1 px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-navy-800/80 rounded-lg text-emerald-600 dark:text-emerald-400">
                ₹ {changeAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>GST Included:</span>
              <span>₹ {totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-20 px-2 py-0.5 text-right text-xs bg-white dark:bg-navy-800 border border-slate-200 dark:border-slate-700 rounded font-semibold focus:outline-none"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
              <span className="text-sm font-bold text-slate-900 dark:text-white">GRAND TOTAL</span>
              <span className="text-xl font-black text-orange-600 dark:text-orange-400">
                ₹ {grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Processing Transaction...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>COMPLETE SALE & PRINT (₹ {grandTotal.toLocaleString()})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Invoice Modal for A4 & Thermal Print */}
      <InvoiceModal
        sale={completedSale}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};
