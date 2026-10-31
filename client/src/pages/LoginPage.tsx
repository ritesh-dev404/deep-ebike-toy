import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const res = await login(username, password);
    if (!res.success) {
      setError(res.message || 'Login failed');
    }
    setIsLoading(false);
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-800 to-navy-900 border border-slate-700 shadow-xl mb-4">
            <Zap className="w-8 h-8 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            DEEP <span className="text-orange-500">E-BIKE & TOY</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Retail POS & Inventory Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-white">Sign In to POS</h2>
              <p className="text-xs text-slate-400">Enter your credentials to continue</p>
            </div>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. owner or employee"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center">
              Quick 1-Click Demo Logins
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickFill('owner', 'Password@123')}
                className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-orange-500/50 text-left transition-all"
              >
                <p className="text-xs font-bold text-orange-400">Store Owner</p>
                <p className="text-[10px] text-slate-400">owner / Password@123</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('employee', 'Password@123')}
                className="px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 border border-slate-700 hover:border-blue-500/50 text-left transition-all"
              >
                <p className="text-xs font-bold text-blue-400">Sales Associate</p>
                <p className="text-[10px] text-slate-400">employee / Password@123</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          DEEP E-BIKE & TOY • Production POS v1.0.0
        </p>
      </div>
    </div>
  );
};
