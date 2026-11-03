import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Lock,
  User,
  AlertCircle,
  ShieldCheck,
  Phone,
  Mail,
  UserCheck,
  UserPlus,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, registerEmployee, initialSetup, setupRequired } = useAuth();

  // Active Tab: 'OWNER' | 'EMPLOYEE' | 'REGISTER'
  const [activeTab, setActiveTab] = useState<'OWNER' | 'EMPLOYEE' | 'REGISTER'>('OWNER');

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Employee Registration Form State
  const [regForm, setRegForm] = useState({
    fullName: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // First-time setup state (when zero users exist)
  const [setupForm, setSetupForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    email: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Switch tabs cleanly
  const handleTabChange = (tab: 'OWNER' | 'EMPLOYEE' | 'REGISTER') => {
    setActiveTab(tab);
    setError(null);
    setSuccessMsg(null);
  };

  // Submit Owner or Employee Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const expectedRole = activeTab === 'OWNER' ? 'OWNER' : 'EMPLOYEE';
    const res = await login(username, password, expectedRole);

    if (!res.success) {
      setError(res.message || 'Login failed. Please check credentials.');
    }
    setIsLoading(false);
  };

  // Submit Employee Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (regForm.phone.trim().replace(/[\s\-()]/g, '').length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    const res = await registerEmployee({
      fullName: regForm.fullName,
      username: regForm.username,
      phone: regForm.phone,
      password: regForm.password,
      confirmPassword: regForm.confirmPassword,
    });

    if (res.success) {
      setSuccessMsg(
        'Registration submitted successfully! Your account is pending Store Owner approval before you can log in.'
      );
      const registeredUsername = regForm.username;
      setRegForm({
        fullName: '',
        username: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      // Pre-fill username for when they switch to Employee Login
      setUsername(registeredUsername);
    } else {
      setError(res.message || 'Registration failed');
    }
    setIsLoading(false);
  };

  // Submit First-Time Owner Setup (when database is completely empty)
  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (setupForm.password !== setupForm.confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    if (setupForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    const res = await initialSetup({
      username: setupForm.username,
      password: setupForm.password,
      fullName: setupForm.fullName,
      phone: setupForm.phone || undefined,
      email: setupForm.email || undefined,
    });

    if (!res.success) {
      setError(res.message || 'First-time setup failed');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-800 to-navy-900 border border-slate-700 shadow-xl mb-3">
            <Zap className="w-8 h-8 text-orange-500 fill-orange-500 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            DEEP <span className="text-orange-500">E-BIKE & TOY</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Retail POS & Shop Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/90 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-slate-700 shadow-2xl">
          {setupRequired ? (
            /* First-Time Setup UI */
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
                <div>
                  <h2 className="text-lg font-bold text-white">First-Time Setup</h2>
                  <p className="text-xs text-orange-400 font-medium">Create your initial Store Owner account</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSetupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={setupForm.fullName}
                    onChange={(e) => setSetupForm({ ...setupForm, fullName: e.target.value })}
                    placeholder="e.g. Deepak Sharma"
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={setupForm.username}
                      onChange={(e) => setSetupForm({ ...setupForm, username: e.target.value })}
                      placeholder="e.g. owner"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={setupForm.phone}
                      onChange={(e) => setSetupForm({ ...setupForm, phone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={setupForm.email}
                    onChange={(e) => setSetupForm({ ...setupForm, email: e.target.value })}
                    placeholder="owner@deepebikeandtoy.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={setupForm.password}
                      onChange={(e) => setSetupForm({ ...setupForm, password: e.target.value })}
                      placeholder="Min 6 chars"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      value={setupForm.confirmPassword}
                      onChange={(e) => setSetupForm({ ...setupForm, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                      className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? 'Creating Owner Account...' : 'Complete First-Time Setup'}
                </button>
              </form>
            </div>
          ) : (
            /* 3-Option Authentication Interface */
            <div>
              {/* Modern 3-Option Segmented Control Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-700/80 mb-6">
                <button
                  type="button"
                  onClick={() => handleTabChange('OWNER')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'OWNER'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Owner</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('EMPLOYEE')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'EMPLOYEE'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Employee</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('REGISTER')}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'REGISTER'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {/* Header Title per Active Option */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-700">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {activeTab === 'OWNER' && 'Store Owner Login'}
                    {activeTab === 'EMPLOYEE' && 'Staff & Cashier Login'}
                    {activeTab === 'REGISTER' && 'Employee Registration'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeTab === 'OWNER' && 'Full administrative & store control access'}
                    {activeTab === 'EMPLOYEE' && 'Sign in with your employee username'}
                    {activeTab === 'REGISTER' && 'Submit details for owner approval'}
                  </p>
                </div>
                <div
                  className={`p-2 rounded-lg border ${
                    activeTab === 'OWNER'
                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      : activeTab === 'EMPLOYEE'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {activeTab === 'OWNER' && <ShieldCheck className="w-5 h-5" />}
                  {activeTab === 'EMPLOYEE' && <UserCheck className="w-5 h-5" />}
                  {activeTab === 'REGISTER' && <UserPlus className="w-5 h-5" />}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Success Banner */}
              {successMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
                    <span className="leading-relaxed font-medium">{successMsg}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('EMPLOYEE')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 pt-1"
                  >
                    <span>Proceed to Employee Login</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* OPTION 1 & 2: LOGIN FORMS */}
              {activeTab !== 'REGISTER' ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                      {activeTab === 'OWNER' ? 'Owner Username or Email' : 'Employee Username'}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={
                          activeTab === 'OWNER'
                            ? 'Enter owner username or email'
                            : 'Enter employee username (e.g. rohit)'
                        }
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

                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                        activeTab === 'OWNER'
                          ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/30'
                          : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                      }`}
                    >
                      {isLoading ? (
                        'Verifying Credentials...'
                      ) : activeTab === 'OWNER' ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Sign In as Store Owner</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Sign In as Employee</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Switch to Registration hint */}
                  {activeTab === 'EMPLOYEE' && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-slate-400">
                        New staff member?{' '}
                        <button
                          type="button"
                          onClick={() => handleTabChange('REGISTER')}
                          className="font-bold text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          Register here for approval
                        </button>
                      </p>
                    </div>
                  )}
                </form>
              ) : (
                /* OPTION 3: EMPLOYEE REGISTRATION FORM */
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={regForm.fullName}
                        onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                        placeholder="e.g. Rohit Sharma"
                        className="w-full pl-10 pr-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Unique Username
                      </label>
                      <input
                        type="text"
                        required
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                        placeholder="e.g. rohit_sales"
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="10-digit mobile"
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="Min 6 chars"
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={regForm.confirmPassword}
                        onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                        placeholder="Repeat password"
                        className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-700/60 text-[11px] text-slate-400 space-y-1">
                    <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Security & Approval Policy
                    </p>
                    <p>
                      Your account will be registered in <span className="text-amber-400 font-bold">PENDING</span> status. The Store Owner must approve your account in the Management portal before you can log in.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? 'Submitting Registration...' : 'Register for Staff Access'}
                  </button>

                  <div className="text-center pt-1">
                    <p className="text-xs text-slate-400">
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => handleTabChange('EMPLOYEE')}
                        className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
                      >
                        Employee Login
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          DEEP E-BIKE & TOY • Production POS v1.0.0
        </p>
      </div>
    </div>
  );
};
