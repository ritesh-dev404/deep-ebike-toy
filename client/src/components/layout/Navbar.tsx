import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSync } from '../../context/SyncContext';
import {
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  LogOut,
  User,
  Shield,
  Zap,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isOnline, isSyncing, pendingCount, triggerSync } = useSync();

  return (
    <header className="h-16 bg-white dark:bg-navy-850 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-900 to-slate-800 dark:from-slate-800 dark:to-navy-950 flex items-center justify-center border border-slate-700 shadow-md">
          <Zap className="w-5 h-5 text-orange-500 fill-orange-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
              DEEP <span className="text-orange-500">E-BIKE & TOY</span>
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
              POS PRO
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            Electric Vehicles & Toys Retail Management
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Sync Status Button */}
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          title="Click to synchronize pending transactions with Cloud"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-500 text-white animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Online / Offline Status Indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
            isOnline
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
          }`}
        >
          {isOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Wifi className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Online Mode</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <WifiOff className="w-3.5 h-3.5 hidden sm:inline" />
              <span>Offline SQLite</span>
            </>
          )}
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Pill */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-xs border border-orange-200 dark:border-orange-800">
              {user.fullName.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user.fullName}
              </p>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-orange-500" />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 ml-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
