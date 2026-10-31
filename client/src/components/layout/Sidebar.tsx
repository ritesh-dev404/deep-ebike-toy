import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  Users,
  BarChart3,
  UserCheck,
  LifeBuoy,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { user, isOwner } = useAuth();

  const navigation = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: LayoutDashboard,
      ownerOnly: true,
      badge: null,
    },
    {
      id: 'pos',
      name: 'Smart POS Billing',
      icon: ShoppingCart,
      ownerOnly: false,
      badge: 'F2',
    },
    {
      id: 'products',
      name: 'Product Catalog',
      icon: Package,
      ownerOnly: false,
      badge: null,
    },
    {
      id: 'stock',
      name: 'Stock & Serials',
      icon: Boxes,
      ownerOnly: true,
      badge: null,
    },
    {
      id: 'purchases',
      name: 'Purchases & Suppliers',
      icon: Truck,
      ownerOnly: true,
      badge: null,
    },
    {
      id: 'customers',
      name: 'Customers CRM',
      icon: Users,
      ownerOnly: false,
      badge: null,
    },
    {
      id: 'reports',
      name: 'Sales & Invoices',
      icon: BarChart3,
      ownerOnly: false,
      badge: null,
    },
    {
      id: 'users',
      name: 'Employee Staff',
      icon: UserCheck,
      ownerOnly: true,
      badge: null,
    },
    {
      id: 'settings',
      name: 'Store Settings',
      icon: Settings,
      ownerOnly: true,
      badge: null,
    },
    {
      id: 'support',
      name: 'System & Support',
      icon: LifeBuoy,
      ownerOnly: false,
      badge: null,
    },
  ];

  const visibleNav = navigation.filter((item) => (item.ownerOnly ? isOwner : true));

  return (
    <aside className="w-64 bg-white dark:bg-navy-850 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Navigation
        </div>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-navy-900 text-white dark:bg-orange-600 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-orange-400 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-900/50">
        <div className="rounded-xl p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              DEEP E-BIKE POS
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
              v1.0.0
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Offline SQLite & Cloud Sync
          </p>
        </div>
      </div>
    </aside>
  );
};
