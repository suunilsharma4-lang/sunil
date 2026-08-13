import React, { useState } from 'react';
import { AppState, Customer, CustomerType, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { exportDuesReportToExcel } from '../../utils/excelExport';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  FileSpreadsheet,
  Trash2,
  Printer,
  History,
  FileText,
  KeyRound,
  AlertTriangle,
  Receipt,
  X,
} from 'lucide-react';

interface CustomerManagementProps {
  state: AppState;
  onAddCustomer: (customer: Customer) => void;
  onSettleDue: (customerId: string, amount: number) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onOpenPOS?: () => void;
  onViewInvoice?: (saleId: string) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  state,
  onAddCustomer,
  onSettleDue,
  onDeleteCustomer,
  onOpenPOS,
  onViewInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settle Due Modal State
  const [selectedCustomerForSettle, setSelectedCustomerForSettle] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // View Customer Old Bills Modal State
  const [selectedCustomerForBills, setSelectedCustomerForBills] = useState<Customer | null>(null);

  // Password Protected Customer Delete Modal State
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<Customer | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Add New Customer Modal State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustType, setNewCustType] = useState<CustomerType>('Regular');

  // Indexed Customers list with S.N. (1, 2, 3...)
  const indexedCustomers = state.customers.map((c, index) => ({
    ...c,
    sn: index + 1,
  }));

  const filteredCustomers = indexedCustomers.filter((c) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      c.sn.toString() === term ||
      `#${c.sn}`.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      c.address.toLowerCase().includes(term) ||
      c.id.toLowerCase().includes(term)
    );
  });

  const totalOutstandingDues = state.customers.reduce((acc, c) => acc + c.totalDue, 0);

  const handleExportDuesExcel = () => {
    exportDuesReportToExcel(
      state.customers,
      state.sales,
      `Customer_Dues_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForSettle) return;
    const amt = parseFloat(settleAmount) || 0;
    if (amt <= 0) return;

    onSettleDue(selectedCustomerForSettle.id, amt);
    setIsSettleModalOpen(false);
    setSettleAmount('');
    setSelectedCustomerForSettle(null);
  };

  const handleConfirmDeleteCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = deletePassword.trim();
    if (
      cleanPass === '23571113' ||
      cleanPass === 'Sunil369@' ||
      cleanPass === 'Sunil 359@' ||
      (state.currentUser?.password && cleanPass === state.currentUser.password)
    ) {
      if (deleteCustomerTarget && onDeleteCustomer) {
        onDeleteCustomer(deleteCustomerTarget.id);
      }
      setDeleteCustomerTarget(null);
      setDeletePassword('');
      setDeleteError('');
    } else {
      setDeleteError('Invalid Password!');
    }
  };

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim() || 'N/A',
      address: newCustAddress.trim() || 'Local',
      customerType: newCustType,
      totalPurchases: 0,
      totalPaid: 0,
      totalDue: 0,
      createdAt: new Date().toISOString(),
    };

    onAddCustomer(newCust);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Customer Directory & Ledger Dues</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customer profiles, search by S.N., Name, or Phone, view past invoices, and settle dues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-rose-900 flex items-center space-x-2">
            <span className="text-xs font-bold">Total Dues:</span>
            <span className="font-black text-sm text-rose-700">
              {formatCurrency(totalOutstandingDues)}
            </span>
          </div>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Customer</span>
          </button>

          <button
            onClick={handleExportDuesExcel}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Download Dues Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by S.N. (1, 2..), Customer Name, or Mobile Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Customer List Table with S.N. and Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3 px-4 w-12 text-center">S.N.</th>
                <th className="py-3 px-4">Customer Name & Quick Action</th>
                <th className="py-3 px-4">Mobile / Contact</th>
                <th className="py-3 px-4">Type & Address</th>
                <th className="py-3 px-4 text-right">Total Purchases</th>
                <th className="py-3 px-4 text-right">Due Balance</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No customers found matching search "{searchTerm}".
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const customerSales = state.sales.filter((s) => s.customerId === c.id);
                  const regularSales = customerSales.filter((s) => s.saleType !== 'Dues Clearance');
                  const totalSpent = regularSales.reduce((acc, s) => acc + s.grandTotal, 0);
                  const currentDue = c.totalDue;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      {/* S.N. */}
                      <td className="py-3.5 px-4 font-black text-slate-900 text-center bg-slate-50/50">
                        #{c.sn}
                      </td>

                      {/* Customer Name & "Create Invoice" below name */}
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900 text-sm">{c.name}</p>
                        
                        {/* Quick Invoice Button below Customer Name */}
                        <div className="mt-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenPOS) onOpenPOS();
                            }}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] rounded-lg transition-all cursor-pointer shadow-2xs"
                          >
                            <FileText className="w-3 h-3 text-emerald-700" />
                            <span>+ Create Invoice</span>
                          </button>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        📞 {c.phone}
                      </td>

                      {/* Address & Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded border border-slate-200">
                          {c.customerType}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">📍 {c.address}</p>
                      </td>

                      {/* Total Purchases */}
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatCurrency(totalSpent)}
                      </td>

                      {/* Due Balance: Only show dues if c.totalDue > 0 */}
                      <td className="py-3.5 px-4 text-right font-black">
                        {currentDue > 0 ? (
                          <span className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-extrabold text-xs">
                            {formatCurrency(currentDue)}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                            ✓ No Dues
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* See All Purchased Old Bills */}
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerForBills(c)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-xl transition-colors cursor-pointer inline-flex items-center space-x-1"
                            title="See all purchased old bills"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Old Bills ({customerSales.length})</span>
                          </button>

                          {/* Settle Due Payment: Only shown if currentDue > 0 */}
                          {currentDue > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomerForSettle(c);
                                setSettleAmount(String(currentDue));
                                setIsSettleModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-xl shadow-2xs transition-colors cursor-pointer inline-flex items-center space-x-1"
                              title="Settle Due Payment"
                            >
                              <span>💵 Settle Due</span>
                            </button>
                          )}

                          {/* Delete Customer */}
                          {onDeleteCustomer && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteCustomerTarget(c);
                                setDeletePassword('');
                                setDeleteError('');
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete Customer"
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

      {/* Settle Due Modal */}
      {isSettleModalOpen && selectedCustomerForSettle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900">Settle Customer Due & Issue Receipt</h3>
            <p className="text-xs text-slate-600">
              Customer: <span className="font-bold text-slate-900">{selectedCustomerForSettle.name}</span>
            </p>

            <form onSubmit={handleSettleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (रु.)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-extrabold text-emerald-700"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSettleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Confirm & Print Due Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Old Bills Modal */}
      {selectedCustomerForBills && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Purchased Old Bills History
                </h3>
                <p className="text-xs text-slate-500">
                  Customer: <span className="font-bold text-slate-900">{selectedCustomerForBills.name}</span> (📞 {selectedCustomerForBills.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerForBills(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of customer sales */}
            {(() => {
              const custSales = state.sales.filter((s) => s.customerId === selectedCustomerForBills.id);
              if (custSales.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No previous purchase bills found for this customer.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {custSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-black text-emerald-700 text-xs">{sale.invoiceNo}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white border border-slate-300 rounded">
                            {sale.saleType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatDateTime(sale.date)}</p>
                        <p className="text-[11px] font-semibold text-slate-700 mt-1">
                          Items ({sale.items.length}): {sale.items.map((i) => `${i.productName} (x${i.qty})`).join(', ')}
                        </p>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <p className="font-black text-sm text-slate-900">{formatCurrency(sale.grandTotal)}</p>
                        <p className="text-[10px] text-slate-500">Paid: {formatCurrency(sale.paidAmount)}</p>
                        
                        {onViewInvoice && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomerForBills(null);
                              onViewInvoice(sale.id);
                            }}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Bill</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Password Protected Delete Customer Modal */}
      {deleteCustomerTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-2xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Security Authorization Required</h3>
                <p className="text-xs text-slate-500">Deleting customer record requires password.</p>
              </div>
            </div>

            <p className="text-xs font-bold text-slate-800 bg-slate-100 p-3 rounded-xl border border-slate-200">
              Customer: <span className="text-rose-700 font-extrabold">{deleteCustomerTarget.name}</span> ({deleteCustomerTarget.phone})
            </p>

            <form onSubmit={handleConfirmDeleteCustomer} className="space-y-3">
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
                    setDeleteCustomerTarget(null);
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
                  Delete Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-extrabold text-base text-slate-900">Add New Customer</h3>

            <form onSubmit={handleCreateNewCustomer} className="space-y-3">
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile / Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. 9812345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Pargatinagar"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Category</label>
                <select
                  value={newCustType}
                  onChange={(e) => setNewCustType(e.target.value as CustomerType)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="Regular">Regular</option>
                  <option value="Student">Student</option>
                  <option value="Photo Client">Photo Client</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Walk-in">Walk-in</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
