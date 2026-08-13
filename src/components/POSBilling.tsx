import React, { useState } from 'react';
import { AppState, Customer, Product, ProductCategory, PRODUCT_CATEGORIES, Sale, SaleItem, SaleType } from '../../types';
import { formatCurrency, generateInvoiceNo } from '../../utils/formatters';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  Printer,
  Barcode,
  Sparkles,
  AlertCircle,
  Tag,
  DollarSign,
  User,
  X,
} from 'lucide-react';

interface POSBillingProps {
  state: AppState;
  onCompleteSale: (sale: Sale) => void;
  onAddCustomer: (customer: Customer) => void;
}

export const POSBilling: React.FC<POSBillingProps> = ({
  state,
  onCompleteSale,
  onAddCustomer,
}) => {
  // Cart items state
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    state.customers[0]?.id || 'cust-104'
  );

  const [saleType, setSaleType] = useState<SaleType>('Accessories');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Discount & Tax State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(0);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Custom Item Modal State (Manual Product / Service Billing)
  const [isCustomItemModalOpen, setIsCustomItemModalOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [customItemCategory, setCustomItemCategory] = useState<ProductCategory>('Other Products');

  // Custom Customer Direct Input Mode
  const [isCustomCustomer, setIsCustomCustomer] = useState(false);
  const [customCustName, setCustomCustName] = useState('');
  const [customCustPhone, setCustomCustPhone] = useState('');
  const [customCustAddress, setCustomCustAddress] = useState('Sudhhodhan-1, Pargatinagar');

  // Auto Add Previous Due State
  const [autoAddPreviousDue, setAutoAddPreviousDue] = useState(true);

  // Quick Add Customer Modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('Pargatinagar');

  const selectedCustomer =
    state.customers.find((c) => c.id === selectedCustomerId) || state.customers[0];

  const customerExistingDue = selectedCustomer && !isCustomCustomer ? selectedCustomer.totalDue : 0;
  const previousDueToAdd = (autoAddPreviousDue && customerExistingDue > 0) ? customerExistingDue : 0;

  // Add Custom Manual Item to Cart
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || !customItemPrice) return;
    const price = parseFloat(customItemPrice) || 0;
    const qty = parseInt(customItemQty, 10) || 1;

    setCart([
      ...cart,
      {
        productId: `custom-${Date.now()}`,
        productName: customItemName.trim(),
        sku: 'CUSTOM-ITEM',
        qty,
        sellingRate: price,
        purchaseRate: 0,
        subtotal: price * qty,
        discount: 0,
      },
    ]);

    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQty('1');
    setIsCustomItemModalOpen(false);
  };

  // Add Product to Cart
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`"${product.name}" is OUT OF STOCK.`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.productId === product.id);
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].qty;
      if (currentQty + 1 > product.stockQuantity) {
        alert(`Cannot add more than available stock (${product.stockQuantity} ${product.unit})`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      updated[existingIndex].subtotal = updated[existingIndex].qty * updated[existingIndex].sellingRate;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          qty: 1,
          sellingRate: product.sellingPrice,
          purchaseRate: product.purchasePrice,
          subtotal: product.sellingPrice,
          discount: 0,
        },
      ]);
    }
  };

  const updateCartQty = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            qty: newQty,
            subtotal: newQty * item.sellingRate,
          };
        }
        return item;
      })
    );
  };

  const updateCartItemName = (productId: string, newName: string) => {
    setCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, productName: newName } : item
      )
    );
  };

  const updateCartItemRate = (productId: string, newRate: number) => {
    const rate = isNaN(newRate) ? 0 : Math.max(0, newRate);
    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, sellingRate: rate, subtotal: rate * item.qty }
          : item
      )
    );
  };

  const handleAddTypeableRow = () => {
    const newId = `typeable-${Date.now()}`;
    setCart([
      ...cart,
      {
        productId: newId,
        productName: 'New Product / Course',
        sku: 'MANUAL',
        qty: 1,
        sellingRate: 0,
        purchaseRate: 0,
        subtotal: 0,
        discount: 0,
      },
    ]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  
  // Calculate discount total
  const calculatedDiscount = discountPercent > 0
    ? (subtotal * discountPercent) / 100
    : discountAmount;

  const afterDiscount = Math.max(0, subtotal - calculatedDiscount);
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const grandTotal = Math.round(afterDiscount + taxAmount + previousDueToAdd);

  const numericPaid = parseFloat(paidAmount) || 0;
  const dueAmount = Math.max(0, grandTotal - numericPaid);
  const changeDue = numericPaid > grandTotal ? numericPaid - grandTotal : 0;

  const paymentStatus: Sale['paymentStatus'] =
    numericPaid >= grandTotal
      ? 'Paid'
      : numericPaid > 0
      ? 'Partial'
      : 'Due';

  // Handle Quick Customer Add
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '',
      address: newCustAddress.trim() || 'Sudhhodhan-1, Pargatinagar',
      customerType: 'Regular',
      totalPurchases: 0,
      totalPaid: 0,
      totalDue: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setNewCustName('');
    setNewCustPhone('');
    setIsCustomerModalOpen(false);
  };

  // Submit Sale & Generate Invoice
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty! Add products before billing.');
      return;
    }

    let finalCustomerId = selectedCustomer?.id || 'cust-104';
    let finalCustomerName = selectedCustomer?.name || 'Walk-in Customer';
    let finalCustomerPhone = selectedCustomer?.phone || '';

    if (isCustomCustomer) {
      if (customCustName.trim()) {
        finalCustomerName = customCustName.trim();
        finalCustomerPhone = customCustPhone.trim();
        const customCust: Customer = {
          id: `cust-${Date.now()}`,
          name: finalCustomerName,
          phone: finalCustomerPhone,
          address: customCustAddress.trim() || 'Sudhhodhan-1, Pargatinagar',
          customerType: 'Regular',
          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        onAddCustomer(customCust);
        finalCustomerId = customCust.id;
      }
    }

    const invoiceNo = generateInvoiceNo(state.sales.length);
    const effectivePaid = numericPaid > 0 ? Math.min(numericPaid, grandTotal) : (paidAmount === '' ? grandTotal : 0);

    const salePayload: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNo,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      saleType,
      date: new Date().toISOString(),
      items: cart,
      subtotal,
      discountAmount: calculatedDiscount,
      discountPercent,
      taxPercent,
      taxAmount,
      grandTotal,
      paidAmount: effectivePaid,
      dueAmount: Math.max(0, grandTotal - effectivePaid),
      paymentStatus: effectivePaid >= grandTotal ? 'Paid' : effectivePaid > 0 ? 'Partial' : 'Due',
      paymentMethod,
      notes: notes.trim(),
      createdBy: state.currentUser?.name || 'Sunil Sharma',
      previousDueAdded: previousDueToAdd,
    };

    onCompleteSale(salePayload);

    // Reset Form
    setCart([]);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setTaxPercent(0);
    setPaidAmount('');
    setNotes('');
    setCustomCustName('');
    setCustomCustPhone('');
  };

  // Filter products for left grid
  const filteredProducts = state.products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      
      {/* Left Column: Product Catalog & Search (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        
        {/* Top Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            <div className="relative flex items-center shrink-0" style={{ width: '5cm', height: '1cm' }}>
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-full pl-8 pr-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Custom Manual Item Adder Button */}
            <button
              onClick={() => setIsCustomItemModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Custom Item / Service</span>
            </button>

            {/* Sale Type Picker */}
            <div className="shrink-0 w-full sm:w-auto">
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as SaleType)}
                className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold"
              >
                <option value="Computer Sale">💻 Computer Sale</option>
                <option value="Accessories">🖱️ Accessories</option>
                <option value="Photo Printing">📷 Photo Printing</option>
                <option value="Frame Order">🖼️ Frame Order</option>
                <option value="Service Charge">🔧 Service Charge</option>
                <option value="Course Fee">🎓 Course Fee</option>
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold cursor-pointer shrink-0 ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items
            </button>
            {PRODUCT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-1 min-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(product)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                    isOutOfStock
                      ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:border-emerald-500 hover:shadow-md border-slate-200 active:scale-95'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                      {product.category}
                    </span>
                    <h4 className="font-extrabold text-xs text-slate-900 line-clamp-2 leading-tight">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="font-black text-sm text-emerald-700">
                      {formatCurrency(product.sellingPrice)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {product.stockQuantity} {product.unit}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Right Column: Billing Checkout Cart & Customer Selection (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        
        {/* Customer & Sale Info Box */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Customer Details</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsCustomCustomer(!isCustomCustomer)}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  isCustomCustomer
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                {isCustomCustomer ? '✓ Custom Entry Mode' : '✍️ Custom Customer'}
              </button>

              <button
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </button>
            </div>
          </div>

          {!isCustomCustomer ? (
            <div className="space-y-2">
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              >
                {state.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.totalDue > 0 ? `- Due: ${formatCurrency(c.totalDue)}` : '(No Dues)'}
                  </option>
                ))}
              </select>

              {/* Automatic Previous Due Alert & Toggle */}
              {customerExistingDue > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
                    <span className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Returning Customer Has Due Balance!</span>
                    </span>
                    <span className="text-rose-700">{formatCurrency(customerExistingDue)}</span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-amber-800 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={autoAddPreviousDue}
                      onChange={(e) => setAutoAddPreviousDue(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Automatically add previous due ({formatCurrency(customerExistingDue)}) to this new bill</span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            /* Custom Customer Input Fields */
            <div className="space-y-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
              <p className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wide">
                Custom Invoice Customer Info (Optional Phone/Address)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Customer Name (e.g. Sunil)"
                  value={customCustName}
                  onChange={(e) => setCustomCustName(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Phone Number (Optional)"
                  value={customCustPhone}
                  onChange={(e) => setCustomCustPhone(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
                <input
                  type="text"
                  placeholder="Address (e.g. Sudhhodhan-1)"
                  value={customCustAddress}
                  onChange={(e) => setCustomCustAddress(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex-1 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-500">
              <span>Selected Products ({cart.length})</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleAddTypeableRow}
                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg border border-emerald-200 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Add Item Row</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-rose-600 hover:underline text-[11px] cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto mt-2 space-y-2">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium space-y-2">
                  <p>🛒 Cart is empty. Click items from catalog or add a row.</p>
                  <button
                    type="button"
                    onClick={handleAddTypeableRow}
                    className="px-3 py-1.5 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    + Add Typeable Product Row
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.productId} className="py-2 space-y-1.5">
                    {/* Item Name (Typeable) */}
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateCartItemName(item.productId, e.target.value)}
                        placeholder="Product / Item Name..."
                        className="flex-1 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price, Qty and Subtotal Controls */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {/* Price / Rate (Typeable) */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-400 font-bold">Rate:</span>
                        <input
                          type="number"
                          min="0"
                          value={item.sellingRate}
                          onChange={(e) => updateCartItemRate(item.productId, parseFloat(e.target.value))}
                          className="w-20 px-1.5 py-0.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-right"
                        />
                      </div>

                      {/* Qty Controls */}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-400 font-bold">Qty:</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.qty - 1)}
                          className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateCartQty(item.productId, parseInt(e.target.value, 10) || 1)}
                          className="w-10 text-center font-extrabold text-xs text-slate-900 border border-slate-200 rounded py-0.5"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.productId, item.qty + 1)}
                          className="w-5 h-5 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right w-20 font-black text-xs text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Discounts, Tax & Calculations */}
          <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Discount (रु. / %)</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Discount Rs."
                    value={discountAmount || ''}
                    onChange={(e) => {
                      setDiscountAmount(parseFloat(e.target.value) || 0);
                      setDiscountPercent(0);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Tax / VAT (%)</label>
                <select
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                >
                  <option value={0}>0% Tax Exempt</option>
                  <option value={13}>13% VAT</option>
                  <option value={5}>5% Service Tax</option>
                </select>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as Sale['paymentMethod'])}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white"
                >
                  <option value="Cash">💵 Cash</option>
                  <option value="Online (eSewa/Khalti)">📲 Online (eSewa/Khalti)</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Amount Paid (रु.)</label>
                <input
                  type="number"
                  min="0"
                  placeholder={`Exact: ${grandTotal}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-black text-emerald-800"
                />
              </div>
            </div>

            {/* Subtotals & Grand Total Summary */}
            <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1.5 shadow-md">
              <div className="flex justify-between text-slate-300 text-xs">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>

              {calculatedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 text-xs font-semibold">
                  <span>Discount Off:</span>
                  <span>- {formatCurrency(calculatedDiscount)}</span>
                </div>
              )}

              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-300 text-xs">
                  <span>VAT ({taxPercent}%):</span>
                  <span>+ {formatCurrency(taxAmount)}</span>
                </div>
              )}

              {previousDueToAdd > 0 && (
                <div className="flex justify-between text-amber-300 text-xs font-bold pt-1 border-t border-slate-800">
                  <span>Previous Unpaid Due Added:</span>
                  <span>+ {formatCurrency(previousDueToAdd)}</span>
                </div>
              )}

              <div className="flex justify-between pt-1.5 border-t border-slate-700 font-black text-base text-white">
                <span>Grand Total:</span>
                <span className="text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>

              {dueAmount > 0 ? (
                <div className="flex justify-between text-rose-300 font-bold text-xs pt-1 border-t border-slate-800">
                  <span>Due Balance:</span>
                  <span>{formatCurrency(dueAmount)}</span>
                </div>
              ) : changeDue > 0 ? (
                <div className="flex justify-between text-emerald-300 font-bold text-xs pt-1 border-t border-slate-800">
                  <span>Change Due Return:</span>
                  <span>{formatCurrency(changeDue)}</span>
                </div>
              ) : null}
            </div>

            {/* Complete Sale & Print Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                cart.length === 0
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white transform hover:scale-[1.01]'
              }`}
            >
              <Printer className="w-5 h-5" />
              <span>Complete Sale & Print Bill (Half-A4)</span>
            </button>

          </div>

        </div>

      </div>

      {/* Quick Add Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add New Customer</h3>
            
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil Sharma"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Custom Product / Service Billing Modal */}
      {isCustomItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Add Custom Product / Service to Bill</span>
              </h3>
              <button
                onClick={() => setIsCustomItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product / Service Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Photo Framing 16x24 inch / Laptop Repair"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (रु.) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Price in Rs."
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={customItemQty}
                    onChange={(e) => setCustomItemQty(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCustomItemModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Add to Cart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
