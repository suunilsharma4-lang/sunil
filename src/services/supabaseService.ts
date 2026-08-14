import { supabase } from '../lib/supabase';
import { AppState, BusinessInfo, Customer, Expense, Product, Purchase, Sale, Supplier, User } from '../types';

// ==========================================
// 1. GLOBAL STATE SUPABASE SYNC FUNCTIONS
// ==========================================

export async function fetchFullStateFromSupabase(): Promise<AppState | null> {
  try {
    const { data, error } = await supabase
      .from('app_state')
      .select('state')
      .eq('id', 'sunshine_erp_global')
      .maybeSingle();

    if (error) {
      console.warn('Supabase app_state fetch warning:', error.message);
      return null;
    }

    if (data && data.state) {
      return data.state as AppState;
    }
  } catch (err) {
    console.error('Failed to fetch state from Supabase:', err);
  }
  return null;
}

export async function syncStateToSupabase(state: AppState): Promise<void> {
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({
        id: 'sunshine_erp_global',
        state,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.warn('Supabase app_state upsert warning:', error.message);
    }
  } catch (err) {
    console.error('Failed to sync state to Supabase:', err);
  }
}

// Subscribe to real-time changes on Supabase app_state table
export function subscribeToSupabaseStateChanges(onRemoteStateChange: (newState: AppState) => void) {
  const channel = supabase
    .channel('app_state_realtime')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'app_state', filter: 'id=eq.sunshine_erp_global' },
      (payload) => {
        if (payload.new && payload.new.state) {
          onRemoteStateChange(payload.new.state as AppState);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ==========================================
// 2. INDIVIDUAL ENTITY CRUD DATA OPERATIONS
// ==========================================

// --- PRODUCTS ---
export async function fetchProductsFromSupabase(): Promise<Product[]> {
  const { data, error } = await supabase.from('products').select('*');
  if (error || !data) return [];
  return data.map((item) => ({
    id: item.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    brand: item.brand,
    purchasePrice: Number(item.purchase_price || 0),
    sellingPrice: Number(item.selling_price || 0),
    stockQuantity: Number(item.stock_quantity || 0),
    minStockAlert: Number(item.min_stock_alert || 0),
    unit: item.unit,
    supplierId: item.supplier_id,
    supplierName: item.supplier_name,
    imageUrl: item.image_url,
    dateAdded: item.date_added,
    description: item.description,
  }));
}

export async function insertProductToSupabase(product: Product) {
  return await supabase.from('products').insert([{
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    brand: product.brand,
    purchase_price: product.purchasePrice,
    selling_price: product.sellingPrice,
    stock_quantity: product.stockQuantity,
    min_stock_alert: product.minStockAlert,
    unit: product.unit,
    supplier_id: product.supplierId,
    supplier_name: product.supplierName,
    image_url: product.imageUrl,
    date_added: product.dateAdded,
    description: product.description,
  }]);
}

export async function updateProductInSupabase(product: Product) {
  return await supabase.from('products').update({
    sku: product.sku,
    name: product.name,
    category: product.category,
    brand: product.brand,
    purchase_price: product.purchasePrice,
    selling_price: product.sellingPrice,
    stock_quantity: product.stockQuantity,
    min_stock_alert: product.minStockAlert,
    unit: product.unit,
    supplier_id: product.supplierId,
    supplier_name: product.supplierName,
    image_url: product.imageUrl,
    date_added: product.dateAdded,
    description: product.description,
  }).eq('id', product.id);
}

export async function deleteProductFromSupabase(id: string) {
  return await supabase.from('products').delete().eq('id', id);
}

// --- CUSTOMERS ---
export async function fetchCustomersFromSupabase(): Promise<Customer[]> {
  const { data, error } = await supabase.from('customers').select('*');
  if (error || !data) return [];
  return data.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    customerType: c.customer_type,
    totalPurchases: Number(c.total_purchases || 0),
    totalPaid: Number(c.total_paid || 0),
    totalDue: Number(c.total_due || 0),
    createdAt: c.created_at,
  }));
}

export async function insertCustomerToSupabase(customer: Customer) {
  return await supabase.from('customers').insert([{
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    customer_type: customer.customerType,
    total_purchases: customer.totalPurchases,
    total_paid: customer.totalPaid,
    total_due: customer.totalDue,
    created_at: customer.createdAt || new Date().toISOString(),
  }]);
}

export async function deleteCustomerFromSupabase(id: string) {
  return await supabase.from('customers').delete().eq('id', id);
}

// --- SALES ---
export async function fetchSalesFromSupabase(): Promise<Sale[]> {
  const { data, error } = await supabase.from('sales').select('*').order('date', { ascending: false });
  if (error || !data) return [];
  return data.map((s) => ({
    id: s.id,
    invoiceNo: s.invoice_no,
    customerId: s.customer_id,
    customerName: s.customer_name,
    customerPhone: s.customer_phone,
    saleType: s.sale_type,
    date: s.date,
    items: s.items || [],
    subtotal: Number(s.subtotal || 0),
    discountAmount: Number(s.discount_amount || 0),
    discountPercent: Number(s.discount_percent || 0),
    taxPercent: Number(s.tax_percent || 0),
    taxAmount: Number(s.tax_amount || 0),
    grandTotal: Number(s.grand_total || 0),
    paidAmount: Number(s.paid_amount || 0),
    dueAmount: Number(s.due_amount || 0),
    paymentStatus: s.payment_status,
    paymentMethod: s.payment_method,
    notes: s.notes,
    createdBy: s.created_by,
    previousDueAdded: Number(s.previous_due_added || 0),
    mergedIntoInvoiceNo: s.merged_into_invoice_no,
  }));
}

export async function insertSaleToSupabase(sale: Sale) {
  return await supabase.from('sales').insert([{
    id: sale.id,
    invoice_no: sale.invoiceNo,
    customer_id: sale.customerId,
    customer_name: sale.customerName,
    customer_phone: sale.customerPhone,
    sale_type: sale.saleType,
    date: sale.date,
    items: sale.items,
    subtotal: sale.subtotal,
    discount_amount: sale.discountAmount,
    discount_percent: sale.discountPercent,
    tax_percent: sale.taxPercent,
    tax_amount: sale.taxAmount,
    grand_total: sale.grandTotal,
    paid_amount: sale.paidAmount,
    due_amount: sale.dueAmount,
    payment_status: sale.paymentStatus,
    payment_method: sale.paymentMethod,
    notes: sale.notes,
    created_by: sale.createdBy,
    previous_due_added: sale.previousDueAdded,
    merged_into_invoice_no: sale.mergedIntoInvoiceNo,
  }]);
}

export async function deleteSaleFromSupabase(id: string) {
  return await supabase.from('sales').delete().eq('id', id);
}

// --- EXPENSES ---
export async function fetchExpensesFromSupabase(): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  if (error || !data) return [];
  return data.map((e) => ({
    id: e.id,
    title: e.title,
    category: e.category,
    amount: Number(e.amount || 0),
    date: e.date,
    description: e.description,
    paymentMethod: e.payment_method,
    referenceNo: e.reference_no,
  }));
}

export async function insertExpenseToSupabase(expense: Expense) {
  return await supabase.from('expenses').insert([{
    id: expense.id,
    title: expense.title,
    category: expense.category,
    amount: expense.amount,
    date: expense.date,
    description: expense.description,
    payment_method: expense.paymentMethod,
    reference_no: expense.referenceNo,
  }]);
}

export async function deleteExpenseFromSupabase(id: string) {
  return await supabase.from('expenses').delete().eq('id', id);
}

// --- BUSINESS INFO ---
export async function fetchBusinessInfoFromSupabase(): Promise<BusinessInfo | null> {
  const { data, error } = await supabase
    .from('business_info')
    .select('*')
    .eq('id', 'primary')
    .maybeSingle();

  if (error || !data) return null;

  return {
    name: data.name,
    location: data.location,
    founder: data.founder,
    contact: data.contact,
    email: data.email,
    logoUrl: data.logo_url,
    showLogoOnInvoice: data.show_logo_on_invoice,
    showLogoInHeader: data.show_logo_in_header,
    panVatNo: data.pan_vat_no,
    invoiceNotice: data.invoice_notice,
  };
}

export async function updateBusinessInfoInSupabase(info: BusinessInfo) {
  return await supabase.from('business_info').upsert({
    id: 'primary',
    name: info.name,
    location: info.location,
    founder: info.founder,
    contact: info.contact,
    email: info.email,
    logo_url: info.logoUrl,
    show_logo_on_invoice: info.showLogoOnInvoice,
    show_logo_in_header: info.showLogoInHeader,
    pan_vat_no: info.panVatNo,
    invoice_notice: info.invoiceNotice,
  });
}
