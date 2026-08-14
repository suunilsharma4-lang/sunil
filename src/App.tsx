import React, { useEffect, useState } from 'react';
import { AppState, BusinessInfo, Customer, Expense, Product, Purchase, Sale, Supplier, User, UserRole } from './types';
import { loadAppState, saveAppState } from './utils/storage';
import { 
  fetchFullStateFromSupabase, 
  subscribeToSupabaseStateChanges, 
  syncStateToSupabase,
  insertProductToSupabase,
  updateProductInSupabase,
  deleteProductFromSupabase,
  insertCustomerToSupabase,
  deleteCustomerFromSupabase,
  insertSaleToSupabase,
  deleteSaleFromSupabase,
  insertExpenseToSupabase,
  deleteExpenseFromSupabase,
  updateBusinessInfoInSupabase,
  fetchBusinessInfoFromSupabase
} from './services/supabaseService';
import { Header } from './components/Navigation/Header';
import { Sidebar } from './components/Navigation/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductManagement } from './components/Inventory/ProductManagement';
import { POSBilling } from './components/POS/POSBilling';
import { SalesHistory } from './components/Sales/SalesHistory';
import { CustomerManagement } from './components/Customers/CustomerManagement';
import { ExpenseManagement } from './components/Expenses/ExpenseManagement';
import { FinancialReports } from './components/Reports/FinancialReports';
import { DailyClosingReport } from './components/Reports/DailyClosingReport';
import { InvoiceModal } from './components/Billing/InvoiceModal';
import { BackupSettings } from './components/Backup/BackupSettings';
import { LoginModal } from './components/Auth/LoginModal';

export default function App() {
  const [state, setState] = useState<AppState>(loadAppState);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Invoice Modal State
  const [activeInvoiceSale, setActiveInvoiceSale] = useState<Sale | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [triggerConfetti, setTriggerConfetti] = useState(false);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load initial state from Supabase on startup
  useEffect(() => {
    let isMounted = true;
    async function loadSupabaseData() {
      // 1. App State sync
      const remoteState = await fetchFullStateFromSupabase();
      if (remoteState && isMounted) {
        setState((prev) => ({
          ...prev,
          ...remoteState,
        }));
      }

      // 2. Direct Business Info/Logo Sync (For extra stability)
      const bInfo = await fetchBusinessInfoFromSupabase();
      if (bInfo && isMounted) {
        setState((prev) => ({
          ...prev,
          businessInfo: bInfo,
        }));
      }
    }
    loadSupabaseData();

    // Subscribe to real-time remote state changes
    const unsubscribe = subscribeToSupabaseStateChanges((newRemoteState) => {
      if (isMounted && newRemoteState) {
        setState((prev) => ({
          ...prev,
          ...newRemoteState,
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync state to local storage & Supabase on changes
  useEffect(() => {
    saveAppState(state);
    syncStateToSupabase(state);
  }, [state]);

  // Handlers for Products
  const handleAddProduct = async (product: Product) => {
    // Local state update
    setState((prev) => ({
      ...prev,
      products: [product, ...prev.products],
    }));
    // Supabase DB direct update
    await insertProductToSupabase(product);
  };

  const handleUpdateProduct = async (updated: Product) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === updated.id ? updated : p)),
    }));
    await updateProductInSupabase(updated);
  };

  const handleDeleteProduct = async (id: string) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
    await deleteProductFromSupabase(id);
  };

  // Handlers for Sales
  const handleCompleteSale = async (sale: Sale) => {
    // 1. Deduct Stock automatically for catalog items
    const updatedProducts = state.products.map((p) => {
      const soldItem = sale.items.find((i) => i.productId === p.id);
      if (soldItem) {
        const updatedProd = {
          ...p,
          stockQuantity: Math.max(0, p.stockQuantity - soldItem.qty),
        };
        updateProductInSupabase(updatedProd); // Async update
        return updatedProd;
      }
      return p;
    });

    // 2. Mark old unpaid sales for this customer as merged
    let updatedSales = [...state.sales];
    if (sale.previousDueAdded && sale.previousDueAdded > 0) {
      updatedSales = updatedSales.map((s) => {
        if (
          s.customerId === sale.customerId &&
          s.dueAmount > 0 &&
          !s.mergedIntoInvoiceNo
        ) {
          return {
            ...s,
            dueAmount: 0,
            paymentStatus: 'Paid' as const,
            mergedIntoInvoiceNo: sale.invoiceNo,
          };
        }
        return s;
      });
    }

    // 3. Update Customer Totals & Dues
    const updatedCustomers = state.customers.map((c) => {
      if (c.id === sale.customerId) {
        const newTotalDue = sale.previousDueAdded && sale.previousDueAdded > 0
          ? sale.dueAmount
          : c.totalDue + sale.dueAmount;

        return {
          ...c,
          totalPurchases: c.totalPurchases + sale.grandTotal,
          totalPaid: c.totalPaid + sale.paidAmount,
          totalDue: newTotalDue,
        };
      }
      return c;
    });

    // 4. Update App State & Save to Supabase
    setState((prev) => ({
      ...prev,
      sales: [sale, ...updatedSales],
      products: updatedProducts,
      customers: updatedCustomers,
    }));

    await insertSaleToSupabase(sale);

    // 5. Open Invoice Modal
    setActiveInvoiceSale(sale);
    setTriggerConfetti(true);
    setIsInvoiceModalOpen(true);
  };

  // Handlers for Customers
  const handleAddCustomer = async (customer: Customer) => {
    setState((prev) => ({
      ...prev,
      customers: [...prev.customers, customer],
    }));
    await insertCustomerToSupabase(customer);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== customerId),
    }));
    await deleteCustomerFromSupabase(customerId);
  };

  const handleDeleteSale = async (saleId: string) => {
    setState((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== saleId),
    }));
    await deleteSaleFromSupabase(saleId);

    if (activeInvoiceSale?.id === saleId) {
      setIsInvoiceModalOpen(false);
      setActiveInvoiceSale(null);
    }
  };

  const handleSettleCustomerDue = async (customerId: string, amount: number) => {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return;

    const invoiceNo = `INV-${state.sales.length + 1}`;
    const dueSalePayload: Sale = {
      id: `sale-due-${Date.now()}`,
      invoiceNo,
      date: new Date().toISOString(),
      saleType: 'Dues Clearance',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: [
        {
          productId: 'item-due-settlement',
          productName: `Due Payment Settlement - ${customer.name}`,
          sku: 'DUE-SETTLE',
          qty: 1,
          sellingRate: amount,
          purchaseRate: 0,
          subtotal: amount,
          discount: 0,
        },
      ],
      subtotal: amount,
      discountAmount: 0,
      discountPercent: 0,
      taxPercent: 0,
      taxAmount: 0,
      grandTotal: amount,
      paidAmount: amount,
      dueAmount: 0,
      paymentMethod: 'Cash',
      paymentStatus: 'Paid',
      notes: `Due balance payment collected for ${customer.name}`,
      createdBy: state.currentUser?.name || 'Sunil Sharma (Founder)',
    };

    const newDue = Math.max(0, customer.totalDue - amount);
    const updatedCustomers = state.customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          totalPaid: c.totalPaid + amount,
          totalDue: newDue,
        };
      }
      return c;
    });

    setState((prev) => ({
      ...prev,
      sales: [dueSalePayload, ...prev.sales],
      customers: updatedCustomers,
    }));

    await insertSaleToSupabase(dueSalePayload);

    setActiveInvoiceSale(dueSalePayload);
    setTriggerConfetti(true);
    setIsInvoiceModalOpen(true);
  };

  // Handlers for Expenses
  const handleAddExpense = async (expense: Expense) => {
    setState((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
    await insertExpenseToSupabase(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
    await deleteExpenseFromSupabase(id);
  };

  // Handlers for Users & Roles
  const handleAddUser = (user: User) => {
    setState((prev) => ({
      ...prev,
      users: [...prev.users, user],
    }));
  };

  const handleDeleteUser = (id: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
  };

  const handleSwitchRole = (role: UserRole) => {
    const matchingUser = state.users.find((u) => u.role === role) || state.users[0];
    setState((prev) => ({
      ...prev,
      currentUser: matchingUser,
    }));
  };

  // Business Info Update (Logo Stabilizer)
  const handleUpdateBusinessInfo = async (info: BusinessInfo) => {
    setState((prev) => ({
      ...prev,
      businessInfo: info,
    }));
    await updateBusinessInfoInSupabase(info);
  };

  const handleUpdateUserCredentials = (userId: string, newUsername: string, newPassword?: string) => {
    setState((prev) => {
      const updatedUsers = prev.users.map((u) =>
        u.id === userId
          ? { ...u, username: newUsername, ...(newPassword ? { password: newPassword } : {}) }
          : u
      );
      const updatedCurrentUser =
        prev.currentUser?.id === userId
          ? { ...prev.currentUser, username: newUsername, ...(newPassword ? { password: newPassword } : {}) }
          : prev.currentUser;
      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
      };
    });
  };

  // View Bill Modal Trigger
  const handleViewInvoice = (saleId: string) => {
    const sale = state.sales.find((s) => s.id === saleId);
    if (sale) {
      setActiveInvoiceSale(sale);
      setTriggerConfetti(false);
      setIsInvoiceModalOpen(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginModal
        users={state.users}
        businessName={state.businessInfo.name}
        logoUrl={state.businessInfo.logoUrl}
        onLogin={(user) => {
          setState((prev) => ({ ...prev, currentUser: user }));
          setIsLoggedIn(true);
        }}
      />
    );
  }

  const currentUserRole = state.currentUser?.role || 'admin';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        state={state}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPOS={() => setActiveTab('pos')}
        onLogout={() => setIsLoggedIn(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onViewInvoice={handleViewInvoice}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Content Region */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-slate-100 pb-12">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              state={state}
              setActiveTab={setActiveTab}
              onOpenPOS={() => setActiveTab('pos')}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'pos' && (
            <POSBilling
              state={state}
              onCompleteSale={handleCompleteSale}
              onAddCustomer={handleAddCustomer}
            />
          )}

          {activeTab === 'inventory' && (
            <ProductManagement
              state={state}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              userRole={currentUserRole}
            />
          )}

          {activeTab === 'sales' && (
            <SalesHistory
              state={state}
              onViewInvoice={handleViewInvoice}
              onDeleteSale={handleDeleteSale}
            />
          )}

          {activeTab === 'customers' && (
            <CustomerManagement
              state={state}
              onAddCustomer={handleAddCustomer}
              onSettleDue={handleSettleCustomerDue}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenPOS={() => setActiveTab('pos')}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpenseManagement
              state={state}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'reports' && (
            <FinancialReports state={state} />
          )}

          {activeTab === 'daily-closing' && (
            <DailyClosingReport state={state} />
          )}

          {activeTab === 'settings' && (
            <BackupSettings
              state={state}
              onRestoreState={(newState) => setState(newState)}
              onUpdateBusinessInfo={handleUpdateBusinessInfo}
              onUpdateUserCredentials={handleUpdateUserCredentials}
            />
          )}

        </main>
      </div>

      {/* Printable Invoice Modal */}
      {isInvoiceModalOpen && activeInvoiceSale && (
        <InvoiceModal
          sale={activeInvoiceSale}
          businessInfo={state.businessInfo}
          onClose={() => setIsInvoiceModalOpen(false)}
          onDeleteSale={handleDeleteSale}
          triggerConfetti={triggerConfetti}
        />
      )}

    </div>
  );
}
