import React, { useState } from 'react';
import { AppState, CustomDateRange, Expense, Purchase, Sale, TimeFilter } from '../../types';
import { exportToCSV, filterByDateRange, formatCurrency, formatDate } from '../../utils/formatters';
import { exportDuesReportToExcel, exportSalesReportToExcel } from '../../utils/excelExport';
import {
  LineChart,
  Calendar,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  FileText,
  BarChart2,
} from 'lucide-react';

interface FinancialReportsProps {
  state: AppState;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({ state }) => {
  const [reportType, setReportType] = useState<
    'pnl' | 'sales' | 'purchases' | 'expenses' | 'stock' | 'customers'
  >('pnl');

  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Filter Data according to time filter
  const filteredSales = filterByDateRange<Sale>(state.sales, timeFilter, customRange);
  const filteredPurchases = filterByDateRange<Purchase>(state.purchases, timeFilter, customRange);
  const filteredExpenses = filterByDateRange<Expense>(state.expenses, timeFilter, customRange);

  // Math Calculations
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);

  const totalCOGS = filteredSales.reduce((acc, s) => {
    return (
      acc +
      s.items.reduce((itemAcc, item) => itemAcc + item.purchaseRate * item.qty, 0)
    );
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const totalOperatingExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  // Formula: Net Profit = Total Revenue - Total Expense
  const netProfit = totalRevenue - totalOperatingExpenses;

  // Stock valuation calculations
  const totalStockItemsCount = state.products.reduce((acc, p) => acc + p.stockQuantity, 0);
  const stockValuationCost = state.products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);
  const stockValuationRetail = state.products.reduce((acc, p) => acc + p.stockQuantity * p.sellingPrice, 0);
  const potentialStockProfit = stockValuationRetail - stockValuationCost;

  // Export current report to Excel
  const handleExportExcel = () => {
    const filename = `Report_${reportType.toUpperCase()}_${timeFilter}`;

    if (reportType === 'sales') {
      exportSalesReportToExcel(filteredSales, filename);
    } else if (reportType === 'customers') {
      exportDuesReportToExcel(state.customers, state.sales, filename);
    } else {
      // General Excel Export using exportSalesReportToExcel / exportDuesReportToExcel
      if (reportType === 'pnl') {
        exportSalesReportToExcel(filteredSales, filename);
      } else {
        exportSalesReportToExcel(filteredSales, filename);
      }
    }
  };

  // Export current report CSV
  const handleExport = () => {
    const filename = `Report_${reportType.toUpperCase()}_${timeFilter}`;

    if (reportType === 'pnl') {
      const headers = ['Financial Metric', 'Amount (NPR)'];
      const rows = [
        ['Total Sales Revenue', totalRevenue],
        ['Cost of Goods Sold (COGS)', totalCOGS],
        ['Gross Profit', grossProfit],
        ['Total Operating Expenses', totalOperatingExpenses],
        ['Net Profit / Loss', netProfit],
      ];
      exportToCSV(filename, headers, rows);
    } else if (reportType === 'sales') {
      exportSalesReportToExcel(filteredSales, filename);
    } else if (reportType === 'customers') {
      exportDuesReportToExcel(state.customers, state.sales, filename);
    } else if (reportType === 'expenses') {
      const headers = ['Ref No', 'Date', 'Category', 'Title', 'Amount', 'Payment Method'];
      const rows = filteredExpenses.map((e) => [
        e.referenceNo || 'EXP',
        e.date,
        e.category,
        e.title,
        e.amount,
        e.paymentMethod,
      ]);
      exportToCSV(filename, headers, rows);
    } else if (reportType === 'stock') {
      const headers = ['SKU', 'Product Name', 'Category', 'Stock Qty', 'Purchase Rate', 'Selling Rate', 'Valuation Cost', 'Valuation Retail'];
      const rows = state.products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.stockQuantity,
        p.purchasePrice,
        p.sellingPrice,
        p.stockQuantity * p.purchasePrice,
        p.stockQuantity * p.sellingPrice,
      ]);
      exportToCSV(filename, headers, rows);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <LineChart className="w-6 h-6 text-emerald-600" />
            <span>Financial Reports & P&L Analytics</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic revenue, COGS, expense breakdown, and profit calculation system.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 inline mr-1" />
            Print Report
          </button>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 inline mr-1" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Time Period Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Select Time Period:</span>
          </span>

          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['today', 'yesterday', 'week', 'month', 'year', 'all', 'custom'] as TimeFilter[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeFilter(tf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer shrink-0 ${
                  timeFilter === tf
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tf === 'custom' ? '📅 Custom Range' : tf}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Inputs if 'custom' selected */}
        {timeFilter === 'custom' && (
          <div className="flex items-center space-x-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">From Date:</span>
              <input
                type="date"
                value={customRange.from}
                onChange={(e) => setCustomRange({ ...customRange, from: e.target.value })}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-600">To Date:</span>
              <input
                type="date"
                value={customRange.to}
                onChange={(e) => setCustomRange({ ...customRange, to: e.target.value })}
                className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Report Selection Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-1 overflow-x-auto">
        {[
          { id: 'pnl', label: '📊 Profit & Loss Statement' },
          { id: 'sales', label: '🧾 Sales Report' },
          { id: 'purchases', label: '🛒 Purchase Report' },
          { id: 'expenses', label: '💸 Expense Report' },
          { id: 'stock', label: '📦 Stock Valuation Report' },
          { id: 'customers', label: '👥 Customer Dues Ledger' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-colors shrink-0 cursor-pointer ${
              reportType === tab.id
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Body Views */}
      {reportType === 'pnl' && (
        <div className="space-y-6">
          {/* Main Profit & Loss Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h3 className="text-base font-extrabold text-slate-900">
                Profit & Loss Statement ({timeFilter.toUpperCase()})
              </h3>
              <p className="text-xs text-slate-500">
                Formula: Net Profit = Total Revenue - Total Operating Expenses
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Income Side */}
              <div className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900">
                  Total Income / Revenue
                </h4>
                
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-emerald-200">
                  <span className="text-slate-700">Gross Sales Income</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalRevenue)}</span>
                </div>

                <div className="flex justify-between items-center text-xs py-1.5 border-b border-emerald-200">
                  <span className="text-slate-700">Cost of Goods Sold (COGS)</span>
                  <span className="font-bold text-slate-900">- {formatCurrency(totalCOGS)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-extrabold pt-2 text-emerald-900">
                  <span>Gross Profit</span>
                  <span>{formatCurrency(grossProfit)}</span>
                </div>
              </div>

              {/* Expense Side */}
              <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-900">
                  Operating Expenses
                </h4>
                
                <div className="flex justify-between items-center text-xs py-1.5 border-b border-amber-200">
                  <span className="text-slate-700">Shop Expenses & Restocks</span>
                  <span className="font-bold text-slate-900">{formatCurrency(totalOperatingExpenses)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-extrabold pt-2 text-amber-900">
                  <span>Total Operating Expenses</span>
                  <span>{formatCurrency(totalOperatingExpenses)}</span>
                </div>
              </div>

            </div>

            {/* Net Result Box */}
            <div
              className={`p-6 rounded-2xl border text-center text-white font-sans ${
                netProfit >= 0
                  ? 'bg-gradient-to-r from-emerald-900 to-teal-900 border-emerald-700'
                  : 'bg-gradient-to-r from-rose-900 to-slate-900 border-rose-700'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Calculated Net Profit / Loss Result
              </p>
              <p className="text-3xl font-black mt-1">{formatCurrency(netProfit)}</p>
              <p className="text-xs text-slate-300 mt-1">
                {netProfit >= 0 ? '🎉 Positive Operating Profit' : '⚠️ Net Operating Loss'}
              </p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'stock' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-bold uppercase">Stock Valuation (Cost Rate)</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(stockValuationCost)}</p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-800 font-bold uppercase">Stock Valuation (Retail Value)</span>
              <p className="text-xl font-black text-emerald-800 mt-1">{formatCurrency(stockValuationRetail)}</p>
            </div>

            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
              <span className="text-xs text-teal-800 font-bold uppercase">Potential Stock Margin</span>
              <p className="text-xl font-black text-teal-800 mt-1">+{formatCurrency(potentialStockProfit)}</p>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">Product Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-center">In Stock</th>
                <th className="py-2.5 px-3 text-right">Purchase Price</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-right">Total Stock Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state.products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold">{p.sku}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{p.category}</td>
                  <td className="py-2.5 px-3 text-center font-bold">{p.stockQuantity} {p.unit}</td>
                  <td className="py-2.5 px-3 text-right">{formatCurrency(p.purchasePrice)}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{formatCurrency(p.sellingPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {formatCurrency(p.stockQuantity * p.sellingPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(reportType === 'sales' || reportType === 'purchases' || reportType === 'expenses' || reportType === 'customers') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 font-bold mb-3">
            Showing filtered data for {reportType.toUpperCase()} ({filteredSales.length || filteredPurchases.length || filteredExpenses.length} records)
          </p>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Particulars</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportType === 'sales' &&
                filteredSales.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-3 font-mono font-bold">{s.invoiceNo}</td>
                    <td className="py-2.5 px-3">{formatDate(s.date)}</td>
                    <td className="py-2.5 px-3 font-bold">{s.customerName} ({s.saleType})</td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">{formatCurrency(s.grandTotal)}</td>
                  </tr>
                ))}
              {reportType === 'purchases' &&
                filteredPurchases.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 font-mono font-bold">{p.purchaseInvoiceNo}</td>
                    <td className="py-2.5 px-3">{formatDate(p.date)}</td>
                    <td className="py-2.5 px-3 font-bold">{p.supplierName}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatCurrency(p.grandTotal)}</td>
                  </tr>
                ))}
              {reportType === 'expenses' &&
                filteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-2.5 px-3 font-mono font-bold">{e.referenceNo || 'EXP'}</td>
                    <td className="py-2.5 px-3">{formatDate(e.date)}</td>
                    <td className="py-2.5 px-3 font-bold">{e.title} ({e.category})</td>
                    <td className="py-2.5 px-3 text-right font-black text-amber-700">{formatCurrency(e.amount)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
