import { supabase } from '../lib/supabase';
import { AppState, BusinessInfo } from '../types';

const APP_STATE_ID = 'sunshine_erp_global';

// 1. Supabase मा Product/Sale/Customer/Expense सिधै Table मा सेभ गर्ने मुख्य फन्क्सन
export async function syncStateToSupabase(state: AppState) {
  try {
    // A. Backup full state to app_state table as JSON
    await supabase
      .from('app_state')
      .upsert({ id: APP_STATE_ID, state, updated_at: new Date().toISOString() });

    // B. Save Products directly to 'products' table
    if (state.products && state.products.length > 0) {
      const formattedProducts = state.products.map((p) => ({
        id: p.id,
        sku: p.sku || '',
        name: p.name,
        category: p.category || '',
        brand: p.brand || '',
        purchase_price: p.purchasePrice || 0,
        selling_price: p.sellingPrice || 0,
        stock_quantity: p.stockQuantity || 0,
        min_stock_alert: p.minStockAlert || 0,
        unit: p.unit || 'Pcs',
        supplier_id: p.supplierId || '',
        supplier_name: p.supplierName || '',
        image_url: p.imageUrl || '',
        date_added: p.dateAdded || new Date().toISOString(),
        description: p.description || '',
        // CamelCase backup fields
        purchasePrice: p.purchasePrice || 0,
        sellingPrice: p.sellingPrice || 0,
        stockQuantity: p.stockQuantity || 0,
        minStockAlert: p.minStockAlert || 0,
      }));

      const { error: prodError } = await supabase.from('products').upsert(formattedProducts);
      if (prodError) console.error('Error saving products table:', prodError);
    }

    // C. Save Customers
    if (state.customers && state.customers.length > 0) {
      const formattedCustomers = state.customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        customer_type: c.customerType || 'Retail',
        total_purchases: c.totalPurchases || 0,
        total_paid: c.totalPaid || 0,
        total_due: c.totalDue || 0,
        created_at: c.createdAt || new Date().toISOString(),
      }));
      await supabase.from('customers').upsert(formattedCustomers);
    }

    // D. Save Business Info
    if (state.businessInfo) {
      await supabase.from('business_info').upsert({
        id: 'primary',
        name: state.businessInfo.name,
        location: state.businessInfo.location,
        founder: state.businessInfo.founder,
        contact: state.businessInfo.contact,
        email: state.businessInfo.email,
        logo_url: state.businessInfo.logoUrl,
        show_logo_on_invoice: state.businessInfo.showLogoOnInvoice,
        show_logo_in_header: state.businessInfo.showLogoInHeader,
        pan_vat_no: state.businessInfo.panVatNo,
        invoice_notice: state.businessInfo.invoiceNotice,
      });
    }
  } catch (err) {
    console.error('Failed to sync state to Supabase:', err);
  }
}

// 2. App खोल्दा डेटा तान्ने फन्क्सन
export async function fetchFullStateFromSupabase(): Promise<Partial<AppState> | null> {
  try {
    // पहिले JSON app_state बाट तान्ने
    const { data: stateData } = await supabase
      .from('app_state')
      .select('state')
      .eq('id', APP_STATE_ID)
      .single();

    let loadedState: Partial<AppState> = stateData?.state || {};

    // यदि Products Table मा छुट्टै डेटा छ भने त्यसलाई पनि तान्ने
    const { data: prodData } = await supabase.from('products').select('*');
    if (prodData && prodData.length > 0) {
      const mappedProducts = prodData.map((p: any) => ({
        id: p.id,
        sku: p.sku || '',
        name: p.name,
        category: p.category || '',
        brand: p.brand || '',
        purchasePrice: Number(p.purchase_price || p.purchasePrice || 0),
        sellingPrice: Number(p.selling_price || p.sellingPrice || 0),
        stockQuantity: Number(p.stock_quantity || p.stockQuantity || 0),
        minStockAlert: Number(p.min_stock_alert || p.minStockAlert || 0),
        unit: p.unit || 'Pcs',
        supplierId: p.supplier_id || p.supplierId || '',
        supplierName: p.supplier_name || p.supplierName || '',
        imageUrl: p.image_url || p.imageUrl || '',
        dateAdded: p.date_added || p.dateAdded || new Date().toISOString(),
        description: p.description || '',
      }));

      loadedState.products = mappedProducts;
    }

    return loadedState;
  } catch (err) {
    console.error('Error fetching state from Supabase:', err);
    return null;
  }
}

// 3. Business Info तान्ने फन्क्सन
export async function fetchBusinessInfoFromSupabase(): Promise<BusinessInfo | null> {
  try {
    const { data } = await supabase.from('business_info').select('*').eq('id', 'primary').single();
    if (!data) return null;
    return {
      name: data.name || '',
      location: data.location || '',
      founder: data.founder || '',
      contact: data.contact || '',
      email: data.email || '',
      logoUrl: data.logo_url || data.logoUrl || '',
      showLogoOnInvoice: data.show_logo_on_invoice ?? true,
      showLogoInHeader: data.show_logo_in_header ?? true,
      panVatNo: data.pan_vat_no || '',
      invoiceNotice: data.invoice_notice || '',
    };
  } catch (err) {
    return null;
  }
}

// 4. Real-time Subscription (अरु Device मा instantly अपडेट हुन)
export function subscribeToSupabaseStateChanges(callback: (newState: Partial<AppState>) => void) {
  const channel = supabase
    .channel('app_state_realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_state', filter: `id=eq.${APP_STATE_ID}` },
      (payload) => {
        if (payload.new && (payload.new as any).state) {
          callback((payload.new as any).state);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
