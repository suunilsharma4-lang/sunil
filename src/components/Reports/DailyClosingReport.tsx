import React from 'react';
import { AppState, Expense, Purchase, Sale } from '../../types';
import { filterByDateRange, formatCurrency, formatDateTime } from '../../utils/formatters';
import { Clock, Printer, DollarSign, Wallet, ShoppingCart, CheckCircle2 } from 'lucide-react';

interface DailyClosingReportProps {
  state: AppState;
}

export const DailyClosingReport: React.FC<DailyClosingReportProps> = ({ state }) => {
  const todaySales = filterByDateRange<Sale>(state.sales, 'today');
  const todayPurchases = filterByDateRange<Purchase>(state.purchases, 'today');
  const todayExpenses = filterByDateRange<Expense>(state.expenses, 'today');

  const cashSales = todaySales
    .filter((s) => s.paymentMethod === 'Cash')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const onlineSales = todaySales
    .filter((s) => s.paymentMethod === 'Online (eSewa/Khalti)')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const cardSales = todaySales
    .filter((s) => s.paymentMethod === 'Card')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const bankSales = todaySales
    .filter((s) => s.paymentMethod === 'Bank Transfer')
    .reduce((acc, s) => acc + s.paidAmount, 0);

  const totalCollectedToday = todaySales.reduce((acc, s) => acc + s.paidAmount, 0);

  const cashExpensesToday = todayExpenses
    .filter((e) => e.paymentMethod === 'Cash')
    .reduce((acc, e) => acc + e.amount, 0);

  const cashPurchasesToday = todayPurchases
    .filter((p) => p.paymentMethod === 'Cash')
    .reduce((acc, p) => acc + p.paidAmount, 0);

  // Net Cash in Drawer = Cash Sales - Cash Expenses - Cash Purchases
  const netCashInDrawer = cashSales - cashExpensesToday - cashPurchasesToday;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Clock className="w-6 h-6 text-emerald-600" />
            <span>Daily Register Closing Summary</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cash register audit report for {formatDateTime(new Date().toISOString())}.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print Daily Closing</span>
        </button>
      </div>

      {/* Main Cash Drawer Calculation Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Cash Collected</span>
          <p className="text-2xl font-black text-emerald-700">{formatCurrency(cashSales)}</p>
          <p className="text-[11px] text-slate-500">From cash bill receipts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Online eSewa / Khalti</span>
          <p className="text-2xl font-black text-teal-700">{formatCurrency(onlineSales)}</p>
          <p className="text-[11px] text-slate-500">Digital QR payments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cash Payouts & Expenses</span>
          <p className="text-2xl font-black text-amber-700">{formatCurrency(cashExpensesToday + cashPurchasesToday)}</p>
          <p className="text-[11px] text-slate-500">Rent, electricity & restocks</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Net Cash in Drawer</span>
          <p className="text-2xl font-black text-white">{formatCurrency(netCashInDrawer)}</p>
          <p className="text-[11px] text-slate-400">Physical drawer balance</p>
        </div>

      </div>

      {/* Itemized Sales Breakdown Today */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900">Today's Transactions Log ({todaySales.length} Sales)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Invoice #</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Sale Type</th>
                <th className="py-2.5 px-3">Payment Method</th>
                <th className="py-2.5 px-3 text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todaySales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{s.invoiceNo}</td>
                  <td className="py-2.5 px-3 text-slate-500">{s.date.split('T')[1]?.slice(0, 5) || 'Today'}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{s.customerName}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.saleType}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{s.paymentMethod}</td>
                  <td className="py-2.5 px-3 text-right font-black text-emerald-700">{formatCurrency(s.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
