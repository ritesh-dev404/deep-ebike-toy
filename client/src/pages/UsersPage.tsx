import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { StatCard } from '../components/common/StatCard';
import {
  UserCheck,
  Plus,
  Shield,
  Phone,
  Mail,
  Lock,
  Edit2,
  CheckCircle2,
  XCircle,
  KeyRound,
  TrendingUp,
  Activity,
  Search,
  Users,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Receipt,
  Clock,
  Sliders,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'permissions'>('staff');
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNER' | 'EMPLOYEE'>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  // Selected User State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [performanceData, setPerformanceData] = useState<any | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleName: 'EMPLOYEE',
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Permissions Matrix State
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [systemPermissions, setSystemPermissions] = useState<any[]>([]);
  const [employeePerms, setEmployeePerms] = useState<string[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRolesAndPermissions();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (e: any) {
      console.error('fetchUsers error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRolesAndPermissions = async () => {
    try {
      const res = await api.get('/users/system/roles-permissions');
      if (res.data.success) {
        setRolesList(res.data.data.roles);
        setSystemPermissions(res.data.data.systemPermissions);
        const empRole = res.data.data.roles.find((r: any) => r.name === 'EMPLOYEE');
        if (empRole) {
          setEmployeePerms(empRole.permissions || []);
        }
      }
    } catch (e) {
      console.error('fetchRolesAndPermissions error:', e);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      roleName: 'EMPLOYEE',
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setSelectedUser(u);
    setFormData({
      username: u.username,
      password: '',
      fullName: u.fullName,
      email: u.email || '',
      phone: u.phone || '',
      roleName: u.role.name,
      isActive: u.isActive,
    });
    setShowEditModal(true);
  };

  const handleOpenPasswordReset = (u: any) => {
    setSelectedUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const handleOpenPerformance = async (u: any) => {
    setSelectedUser(u);
    setPerformanceData(null);
    setShowPerformanceModal(true);
    try {
      const res = await api.get(`/users/${u.id}/performance`);
      if (res.data.success) {
        setPerformanceData(res.data.data);
      }
    } catch (e: any) {
      alert(e.response?.data?.message || 'Failed to load employee metrics');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/users', formData);
      if (res.data.success) {
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await api.put(`/users/${selectedUser.id}`, formData);
      if (res.data.success) {
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update user');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const res = await api.post(`/users/${selectedUser.id}/reset-password`, {
        newPassword,
      });
      if (res.data.success) {
        alert(res.data.message || 'Password reset successfully');
        setShowPasswordModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (u: any) => {
    const actionWord = u.isActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionWord} the account for ${u.fullName}?`)) {
      return;
    }

    try {
      const res = await api.patch(`/users/${u.id}/status`, { isActive: !u.isActive });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to change status');
    }
  };

  const handleToggleEmployeePerm = (permName: string) => {
    setEmployeePerms((prev) =>
      prev.includes(permName) ? prev.filter((p) => p !== permName) : [...prev, permName]
    );
  };

  const handleSaveEmployeePerms = async () => {
    setIsSavingPerms(true);
    try {
      const res = await api.put('/users/system/roles/EMPLOYEE/permissions', {
        permissionNames: employeePerms,
      });
      if (res.data.success) {
        alert('Employee role permissions updated successfully!');
        fetchRolesAndPermissions();
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update permissions');
    } finally {
      setIsSavingPerms(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery)) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);

    const matchesRole = roleFilter === 'ALL' || u.role.name === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Aggregate Stats
  const totalUsers = users.length;
  const activeCount = users.filter((u) => u.isActive).length;
  const employeeCount = users.filter((u) => u.role.name === 'EMPLOYEE').length;
  const totalStaffSales = users.reduce((acc, u) => acc + (u.totalSalesAmount || 0), 0);

  // Group System Permissions by Module
  const permsByModule: Record<string, any[]> = {};
  systemPermissions.forEach((p) => {
    if (!permsByModule[p.module]) {
      permsByModule[p.module] = [];
    }
    permsByModule[p.module].push(p);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Employee Management & Access Control
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
              RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create employee accounts, manage permissions, view sales performance, and enforce role security
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-navy-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'staff'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employees ({totalUsers})</span>
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'permissions'
                  ? 'bg-white dark:bg-navy-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              <span>Permissions Matrix</span>
            </button>
          </div>

          {activeTab === 'staff' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total User Accounts"
          value={totalUsers.toString()}
          subtitle={`${employeeCount} Sales Associates`}
          icon={Users}
        />
        <StatCard
          title="Active Accounts"
          value={activeCount.toString()}
          subtitle={`${totalUsers - activeCount} Deactivated`}
          icon={UserCheck}
        />
        <StatCard
          title="Staff Roles Configured"
          value={rolesList.length.toString()}
          subtitle="OWNER & EMPLOYEE"
          icon={Shield}
        />
        <StatCard
          title="Total Staff Sales"
          value={`₹${totalStaffSales.toLocaleString('en-IN')}`}
          subtitle="Combined staff revenue"
          icon={TrendingUp}
        />
      </div>

      {activeTab === 'staff' ? (
        /* TAB 1: EMPLOYEES DIRECTORY */
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, username, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <select
                value={roleFilter}
                onChange={(e: any) => setRoleFilter(e.target.value)}
                aria-label="Filter staff by role"
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner Only</option>
                <option value="EMPLOYEE">Employees Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                aria-label="Filter staff by active status"
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Accounts</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className={`p-5 bg-white dark:bg-navy-850 rounded-2xl border transition-all shadow-sm space-y-4 ${
                  u.isActive
                    ? 'border-slate-200 dark:border-slate-800'
                    : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl font-black flex items-center justify-center text-sm shadow-sm ${
                        u.role.name === 'OWNER'
                          ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white'
                          : 'bg-slate-100 dark:bg-navy-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                        {u.fullName}
                      </h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">@{u.username}</p>
                    </div>
                  </div>

                  <Badge variant={u.role.name === 'OWNER' ? 'brand' : 'info'} size="sm">
                    {u.role.name}
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {u.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{u.phone}</span>
                    </p>
                  )}
                  {u.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{u.email}</span>
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {u.lastLogin
                        ? `Last Login: ${new Date(u.lastLogin).toLocaleDateString()} ${new Date(
                            u.lastLogin
                          ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Never logged in'}
                    </span>
                  </p>
                </div>

                {/* Sales Performance Mini Bar */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-navy-900/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Bills Raised</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {u._count?.sales || 0} bills
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue</span>
                    <span className="font-extrabold text-orange-600 dark:text-orange-400">
                      ₹{(u.totalSalesAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(u)}
                    title={u.isActive ? 'Deactivate account' : 'Activate account'}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                  >
                    {u.isActive ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 hover:underline">
                        <XCircle className="w-3.5 h-3.5" /> Deactivated
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Performance */}
                    <button
                      onClick={() => handleOpenPerformance(u)}
                      title="View Performance & Audit History"
                      className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg transition-colors"
                    >
                      <Activity className="w-4 h-4" />
                    </button>

                    {/* Reset Password */}
                    <button
                      onClick={() => handleOpenPasswordReset(u)}
                      title="Reset Employee Password"
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(u)}
                      title="Edit User Details"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TAB 2: ROLE-BASED PERMISSIONS MATRIX */
        <div className="p-6 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Employee Access Control Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grant or restrict permissions for the <span className="font-bold text-orange-500">EMPLOYEE</span> role.
                Store Owner always retains complete, unrestricted administrative access.
              </p>
            </div>

            <button
              onClick={handleSaveEmployeePerms}
              disabled={isSavingPerms}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSavingPerms ? 'Saving Changes...' : 'Save Role Permissions'}</span>
            </button>
          </div>

          {/* Module-wise Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(permsByModule).map(([moduleName, perms]) => (
              <div
                key={moduleName}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-navy-900/40 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {moduleName} Module
                  </h4>
                  <Badge variant="neutral" size="sm">
                    {perms.length} actions
                  </Badge>
                </div>

                <div className="space-y-2.5">
                  {perms.map((p) => {
                    const isChecked = employeePerms.includes(p.name);
                    return (
                      <label
                        key={p.id}
                        className="flex items-start gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-navy-850 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEmployeePerm(p.name)}
                          className="mt-0.5 w-4 h-4 text-orange-600 rounded border-slate-300 dark:border-slate-700 focus:ring-orange-500"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {p.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD EMPLOYEE */}
      {showAddModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowAddModal(false)}
          title="Add New Employee Account"
          maxWidth="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rahul Verma"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g. rahul"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Assign Role</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  aria-label="Select role for new employee"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-bold"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Sales Associate)</option>
                  <option value="OWNER">OWNER (Full Admin Access)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="rahul@deepebikeandtoy.com"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30"
              >
                Create Account
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: EDIT EMPLOYEE */}
      {showEditModal && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setShowEditModal(false)}
          title={`Edit Account: ${selectedUser.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Username</label>
                <input
                  type="text"
                  disabled
                  value={formData.username}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-100 dark:bg-navy-800 border rounded-xl opacity-60 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Role</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  aria-label="Select role for editing account"
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-bold"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-orange-600 rounded"
              />
              <label htmlFor="editIsActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Account is Active and allowed to sign in
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
              >
                Save Details
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RESET PASSWORD */}
      {showPasswordModal && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setShowPasswordModal(false)}
          title={`Reset Password: ${selectedUser.fullName}`}
          maxWidth="sm"
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            <p className="text-xs text-slate-500">
              Set a new password for <span className="font-bold text-slate-800 dark:text-slate-200">@{selectedUser.username}</span>.
              The employee will use this password to sign in immediately.
            </p>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30"
              >
                Reset Password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: PERFORMANCE & ACTIVITY AUDIT */}
      {showPerformanceModal && selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setShowPerformanceModal(false)}
          title={`Employee Performance & Activity: ${selectedUser.fullName}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Sales</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {performanceData?.metrics?.totalSalesCount || 0} bills
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue</span>
                <span className="text-base font-black text-orange-600 dark:text-orange-400">
                  ₹{(performanceData?.metrics?.totalRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Avg Bill Size</span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  ₹{(performanceData?.metrics?.averageOrderValue || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Today's Sales</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹{(performanceData?.metrics?.todayRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Recent Sales Table */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-orange-500" />
                <span>Recent Invoices Billed by {selectedUser.fullName}</span>
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {performanceData?.recentSales?.length > 0 ? (
                      performanceData.recentSales.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                          <td className="p-2.5 font-mono font-bold text-orange-600 dark:text-orange-400">
                            {s.invoiceNumber}
                          </td>
                          <td className="p-2.5">{s.customer?.name || 'Walk-in Customer'}</td>
                          <td className="p-2.5 text-slate-400">
                            {new Date(s.saleDate).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 text-right font-bold">
                            ₹{s.grandTotal.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          No sales recorded yet for this employee
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Logs */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Recent Activity & Audit Trail</span>
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {performanceData?.recentAuditLogs?.length > 0 ? (
                    performanceData.recentAuditLogs.map((log: any) => (
                      <div key={log.id} className="p-2.5 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {log.action}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            ({log.entityName})
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="p-4 text-center text-slate-400">No recent activity logs</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
