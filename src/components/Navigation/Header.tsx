import React from 'react';
import { AppState, UserRole } from '../../types';
import {
  Bell,
  Search,
  ShoppingCart,
  UserCheck,
  LogOut,
  Sparkles,
  Printer,
  ShieldCheck,
  User as UserIcon,
  Store,
  AlertTriangle,
} from 'lucide-react';

interface HeaderProps {
  state: AppState;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenPOS: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onViewInvoice?: (saleId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  activeTab,
  setActiveTab,
  onOpenPOS,
  onLogout,
  searchQuery,
  setSearchQuery,
  onViewInvoice,
}) => {
  const currentUser = state.currentUser;
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  // Filter sales matching invoice number, customer name, or phone
  const matchingSales = searchQuery.trim()
    ? state.sales.filter(
        (s) =>
          s.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.customerPhone.includes(searchQuery)
      )
    : [];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white shadow-md print:hidden">
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* Left Title / Branding */}
        <div className="flex items-center space-x-3">
          {state.businessInfo.showLogoInHeader !== false && (
            state.businessInfo.logoUrl ? (
              <img
                src={state.businessInfo.logoUrl}
                alt="Business Logo"
                className="w-10 h-10 object-contain rounded-xl bg-white p-0.5 border border-slate-700 shadow-md shadow-emerald-950/40 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-sm text-white shadow-md shadow-emerald-950/40 shrink-0">
                {state.businessInfo.name
                  ? state.businessInfo.name
                      .split(' ')
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'SC'}
              </div>
            )
          )}
          <div>
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
              <span>{state.businessInfo.name}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              📍 {state.businessInfo.location} | 📞 {state.businessInfo.contact} | Founder: {state.businessInfo.founder}
            </p>
          </div>
        </div>

        {/* Global Search (1*5 cm space) */}
        <div className="hidden md:flex items-center mx-4 relative">
          <div className="relative flex items-center" style={{ width: '5cm', height: '1cm' }}>
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Invoice # / Name..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              className="w-full h-full pl-8 pr-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Quick Invoice / Customer Search Popover */}
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-12 left-0 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs">
              <div className="px-2 py-1 text-[10px] font-extrabold uppercase text-slate-400 flex justify-between items-center border-b border-slate-800">
                <span>Matching Bills / Invoices</span>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 mt-1">
                {matchingSales.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-[11px]">
                    No invoice or customer found for "{searchQuery}".
                  </div>
                ) : (
                  matchingSales.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (onViewInvoice) {
                          onViewInvoice(s.id);
                        } else {
                          setActiveTab('sales');
                        }
                        setIsSearchOpen(false);
                      }}
                      className="w-full p-2 text-left hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-emerald-400">{s.invoiceNo}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded border border-slate-700">
                            {s.saleType}
                          </span>
                        </div>
                        <p className="font-bold text-white text-[11px] mt-0.5">{s.customerName}</p>
                        <p className="text-[10px] text-slate-400">{s.customerPhone}</p>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-white">रु. {s.grandTotal.toLocaleString()}</p>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            s.paymentStatus === 'Paid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {s.paymentStatus}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right User & Actions */}
        <div className="flex items-center space-x-3">
          {/* Quick Sale Button */}
          <button
            onClick={onOpenPOS}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">⚡ New Sale</span>
          </button>

          {/* Admin User Profile */}
          <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-200">{currentUser?.name || 'Sunil Sharma (Founder)'}</p>
              <div className="flex items-center justify-end space-x-1">
                <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Administrator
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Logout / Change User"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};
