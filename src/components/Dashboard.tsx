import React from 'react';
import { AppState, Expense, Purchase, Sale, TimeFilter } from '../../types';
import { formatCurrency, formatDate, filterByDateRange } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  Package,
  AlertTriangle,
  PlusCircle,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Clock,
  Printer,
  ChevronRight,
} from 'lucide-react';

interface DashboardProps {
  state: AppState;
  setActiveTab: (tab: string) => void;
  onOpenPOS: () => void;
  onViewInvoice: (saleId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  setActiveTab,
  onOpenPOS,
  onViewInvoice,
}) => {
  // Today's Sales
  const todaySales = filterByDateRange<Sale>(state.sales, 'today');
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);

  // Today's Purchase
  const todayPurchases = filterByDateRange<Purchase>(state.purchases, 'today');
  const todayPurchaseTotal = todayPurchases.reduce((acc, p) => acc + p.grandTotal, 0);

  // Total Revenue (All Sales Grand Total)
  const totalRevenue = state.sales.reduce((acc, s) => acc + s.grandTotal, 0);

  // Total Expenses (All Expenses)
  const totalExpenses = state.expenses.reduce((acc, e) => acc + e.amount, 0);

  // COGS (Cost of goods sold)
  const totalCOGS = state.sales.reduce((acc, s) => {
    return (
      acc +
      s.items.reduce((itemAcc, item) => itemAcc + item.purchaseRate * item.qty, 0)
    );
  }, 0);

  // Net Profit Formula: Total Revenue - Total Expense
  const netProfit = totalRevenue - totalExpenses;

  // Products
  const totalProducts = state.products.length;

  // Combined Recent Transactions
  const recentTransactions = [
    ...state.sales.map((s) => ({
      type: 'Sale' as const,
      id: s.id,
      title: `${s.saleType} - ${s.customerName}`,
      ref: s.invoiceNo,
      amount: s.grandTotal,
      date: s.date,
      status: s.paymentStatus,
      rawSale: s,
    })),
    ...state.purchases.map((p) => ({
      type: 'Purchase' as const,
      id: p.id,
      title: `Purchase from ${p.supplierName}`,
      ref: p.purchaseInvoiceNo,
      amount: p.grandTotal,
      date: p.date,
      status: p.paymentStatus,
    })),
    ...state.expenses.map((e) => ({
      type: 'Expense' as const,
      id: e.id,
      title: `${e.category}: ${e.title}`,
      ref: e.referenceNo || 'EXPENSE',
      amount: e.amount,
      date: e.date,
      status: 'Paid' as const,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-2xl border border-slate-700/60 shadow-lg text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Management System Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Welcome to {state.businessInfo.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Complete inventory, billing, sales, framing, service center & financial report portal for {state.businessInfo.location}.
          </p>
        </div>

        {/* Quick POS Shortcut */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={onOpenPOS}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer transform hover:scale-[1.02]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>⚡ Create New Sale</span>
          </button>
        </div>
      </div>

      {/* 6 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{formatCurrency(todaySalesTotal)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">{todaySales.length} Transactions today</p>
        </div>

        {/* Today's Purchase */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Purchase</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{formatCurrency(todayPurchaseTotal)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">{todayPurchases.length} Buying receipts</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-teal-700">{formatCurrency(totalRevenue)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Gross income received</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Expenses</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-700">{formatCurrency(totalExpenses)}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">{state.expenses.length} Expense records</p>
        </div>

        {/* Net Profit */}
        <div
          className={`p-4 rounded-2xl border shadow-xs hover:shadow-md transition-shadow ${
            netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-emerald-700'
              : 'bg-gradient-to-br from-rose-900 to-slate-900 text-white border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Net Profit
            </span>
            <div className="p-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black">{formatCurrency(netProfit)}</p>
          <p className="text-[10px] text-slate-300 mt-1 font-medium">Revenue - Expenses</p>
        </div>

        {/* Total Products & Alerts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Products</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900">{totalProducts}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">
            ✓ Active Catalog
          </p>
        </div>

      </div>

      {/* Middle Section: Quick Action Buttons & Financial Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Quick Operations</span>
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenPOS}
              className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
            >
              <ShoppingCart className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>New Billing Sale</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className="p-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 text-blue-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
            >
              <Package className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Add Product</span>
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              className="p-3 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 text-indigo-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
            >
              <ShoppingBag className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
              <span>New Purchase</span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className="p-3 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
            >
              <TrendingDown className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Record Expense</span>
            </button>

            <button
              onClick={() => setActiveTab('daily-closing')}
              className="p-3 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 text-slate-800 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer group"
            >
              <Clock className="w-5 h-5 text-slate-600 group-hover:scale-110 transition-transform" />
              <span>Daily Closing</span>
            </button>
          </div>
        </div>

        {/* Business Category Revenue Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Financial Overview & Category Income</span>
            </h3>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
            >
              <span>View Full P&L</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Visual Bar: Income vs Expense */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-700">Net Profit Ratio</p>
              
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Total Revenue:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">Total Expenses:</span>
                  <span className="font-bold text-amber-700">{formatCurrency(totalExpenses)}</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, totalRevenue ? (totalExpenses / totalRevenue) * 100 : 0)}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-extrabold">
                <span className="text-slate-800">Calculated Net Profit:</span>
                <span className={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>

            {/* Service & Product Sales Streams */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <p className="text-xs font-bold text-slate-700">Income by Business Service</p>
              
              <div className="space-y-2 text-xs">
                {['Computer Sale', 'Accessories', 'Photo Printing', 'Frame Order', 'Service Charge', 'Course Fee'].map((type) => {
                  const typeSales = state.sales
                    .filter((s) => s.saleType === type)
                    .reduce((acc, s) => acc + s.grandTotal, 0);
                  const pct = totalRevenue ? Math.round((typeSales / totalRevenue) * 100) : 0;

                  return (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-medium text-slate-700">{type}</span>
                        <span className="font-bold text-slate-900">{formatCurrency(typeSales)} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Section: Recent Transactions Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Recent Transactions Feed</h3>
            <p className="text-xs text-slate-500">Live feed of sales, purchases, and expenses</p>
          </div>
          <button
            onClick={() => setActiveTab('sales')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View All Invoices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Ref #</th>
                <th className="py-2.5 px-3">Title / Particulars</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.map((tx) => (
                <tr key={`${tx.type}-${tx.id}`} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.type === 'Sale'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tx.type === 'Purchase'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.ref}</td>
                  <td className="py-2.5 px-3 text-slate-700">{tx.title}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDate(tx.date)}</td>
                  <td
                    className={`py-2.5 px-3 text-right font-black ${
                      tx.type === 'Sale' ? 'text-emerald-700' : 'text-slate-800'
                    }`}
                  >
                    {tx.type === 'Expense' ? '-' : ''} {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {tx.type === 'Sale' && tx.rawSale && (
                      <button
                        onClick={() => onViewInvoice(tx.rawSale.id)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg font-bold text-xs inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Bill</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
