import React, { useState } from 'react';
import { AppState, Sale, TimeFilter } from '../../types';
import { exportToCSV, filterByDateRange, formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportSalesReportToExcel } from '../../utils/excelExport';
import { Receipt, Search, Printer, Download, Eye, Calendar, DollarSign, Tag, FileSpreadsheet, Trash2, KeyRound, AlertTriangle } from 'lucide-react';

interface SalesHistoryProps {
  state: AppState;
  onViewInvoice: (saleId: string) => void;
  onDeleteSale?: (saleId: string) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ state, onViewInvoice, onDeleteSale }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Password Protected Sale Delete State
  const [deleteSaleTarget, setDeleteSaleTarget] = useState<Sale | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleConfirmDeleteSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = deletePassword.trim();
    if (
      cleanPass === '23571113' ||
      cleanPass === 'Sunil369@' ||
      cleanPass === 'Sunil 359@' ||
      (state.currentUser?.password && cleanPass === state.currentUser.password)
    ) {
      if (deleteSaleTarget && onDeleteSale) {
        onDeleteSale(deleteSaleTarget.id);
      }
      setDeleteSaleTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  const filteredSales = filterByDateRange<Sale>(state.sales, timeFilter).filter((s) => {
    return (
      s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.saleType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalSalesAmount = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalPaidAmount = filteredSales.reduce((acc, s) => acc + s.paidAmount, 0);
  const totalDueAmount = filteredSales.reduce((acc, s) => acc + s.dueAmount, 0);

  const handleExportExcel = () => {
    exportSalesReportToExcel(filteredSales, `Sales_Report_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Date', 'Customer', 'Phone', 'Sale Type', 'Grand Total', 'Paid', 'Due', 'Status', 'Payment Method'];
    const rows = filteredSales.map((s) => [
      s.invoiceNo,
      s.date,
      s.customerName,
      s.customerPhone,
      s.saleType,
      s.grandTotal,
      s.paidAmount,
      s.dueAmount,
      s.paymentStatus,
      s.paymentMethod,
    ]);
    exportToCSV(`Sales_History_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Sales & Invoices History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Total {filteredSales.length} invoice records generated. View, reprint, or export bill history.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Sales Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Filtered Sales Revenue</p>
          <p className="text-xl font-black text-emerald-700 mt-1">{formatCurrency(totalSalesAmount)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Collected Paid</p>
          <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalPaidAmount)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding Due Balance</p>
          <p className="text-xl font-black text-rose-700 mt-1">{formatCurrency(totalDueAmount)}</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          />
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'today', 'yesterday', 'week', 'month', 'year'] as TimeFilter[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer shrink-0 ${
                timeFilter === tf
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Category / Type</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                    No sales records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isMerged = Boolean(sale.mergedIntoInvoiceNo);
                  return (
                    <tr
                      key={sale.id}
                      className={`transition-colors ${
                        isMerged
                          ? 'bg-emerald-50/70 border-l-4 border-l-emerald-600 hover:bg-emerald-100/60'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {sale.invoiceNo}
                        {isMerged && (
                          <span className="block text-[9px] text-emerald-800 font-bold mt-0.5">
                            Merged in #{sale.mergedIntoInvoiceNo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{formatDateTime(sale.date)}</td>
                      <td className="py-3 px-4">
                        <p className="font-extrabold text-slate-900">{sale.customerName}</p>
                        <p className="text-[10px] text-slate-500">{sale.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {sale.saleType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700 text-sm">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">
                        {formatCurrency(sale.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-rose-700">
                        {sale.dueAmount > 0 ? formatCurrency(sale.dueAmount) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isMerged ? (
                          <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-600 text-white shadow-xs border border-emerald-700">
                            🟢 Added to #{sale.mergedIntoInvoiceNo}
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              sale.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : sale.paymentStatus === 'Partial'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {sale.paymentStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onViewInvoice(sale.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>

                          {onDeleteSale && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteSaleTarget(sale);
                                setDeletePassword('');
                                setDeleteError('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Bill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Protected Delete Bill Modal */}
      {deleteSaleTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Security Authorization Required</h3>
                <p className="text-xs text-slate-500">Deleting bill/invoice record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200">
              Bill: <span className="text-rose-700 font-extrabold">#{deleteSaleTarget.invoiceNo}</span> ({deleteSaleTarget.customerName} - {formatCurrency(deleteSaleTarget.grandTotal)})
            </p>

            <form onSubmit={handleConfirmDeleteSale} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter security password..."
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeleteError('');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {deleteError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteSaleTarget(null);
                    setDeletePassword('');
                    setDeleteError('');
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Delete Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
