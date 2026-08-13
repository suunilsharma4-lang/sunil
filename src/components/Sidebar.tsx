import React from 'react';
import { UserRole } from '../../types';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Truck,
  Users,
  Wallet,
  LineChart,
  ClipboardList,
  AlertCircle,
  Clock,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      id: 'pos',
      label: 'New Sale',
      icon: ShoppingCart,
      adminOnly: false,
      badge: 'Billing',
    },
    {
      id: 'inventory',
      label: 'Products & Inventory',
      icon: Package,
      adminOnly: false,
    },
    {
      id: 'sales',
      label: 'Sales & Invoices',
      icon: Receipt,
      adminOnly: false,
    },
    {
      id: 'customers',
      label: 'Customers & Ledgers',
      icon: Users,
      adminOnly: false,
    },
    {
      id: 'expenses',
      label: 'Expenses Tracker',
      icon: Wallet,
      adminOnly: true,
    },
    {
      id: 'reports',
      label: 'Reports & P&L',
      icon: LineChart,
      adminOnly: true,
    },
    {
      id: 'daily-closing',
      label: 'Daily Closing Report',
      icon: Clock,
      adminOnly: false,
    },
    {
      id: 'settings',
      label: 'Settings & Logo',
      icon: Settings,
      adminOnly: false,
      badge: 'Logo',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 min-h-[calc(100vh-57px)] flex flex-col justify-between p-3 select-none print:hidden">
      <div className="space-y-1">
        
        <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-extrabold text-slate-500">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/30'
                  : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                    isActive
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Institute Info Box */}
      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs text-slate-400 space-y-1 mt-4">
        <p className="font-bold text-slate-200 text-[11px]">Sunshine Computer</p>
        <p className="text-[10px]">Photo & Framing House</p>
        <p className="text-[10px] text-emerald-400 font-medium">Sudhhodhan-1, Pargatinagar</p>
      </div>
    </aside>
  );
};
