import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
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
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    roleName: 'EMPLOYEE',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data.success) setUsers(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      roleName: 'EMPLOYEE',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      password: '',
      fullName: u.fullName,
      email: u.email || '',
      phone: u.phone || '',
      roleName: u.role.name,
      isActive: u.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Staff & Employee Management
          </h2>
          <p className="text-xs text-slate-500">
            Control employee logins, assigned permissions, and active status
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-md shadow-orange-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee Account</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="p-5 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-navy-900 font-bold flex items-center justify-center text-orange-600 dark:text-orange-400 border">
                  {u.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{u.fullName}</h4>
                  <p className="text-xs text-slate-400 font-mono">@{u.username}</p>
                </div>
              </div>
              <Badge variant={u.role.name === 'OWNER' ? 'brand' : 'info'} size="sm">
                {u.role.name}
              </Badge>
            </div>

            <div className="space-y-1 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              {u.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" /> <span>{u.phone}</span>
                </p>
              )}
              {u.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> <span>{u.email}</span>
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold">
                  {u.isActive ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active Account
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Deactivated
                    </span>
                  )}
                </span>
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowModal(false)}
          title={editingUser ? 'Edit User Account' : 'Add Employee'}
          maxWidth="md"
        >
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
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
                <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl disabled:opacity-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  {editingUser ? 'Reset Password' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Leave blank to keep' : '••••••••'}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                <select
                  value={formData.roleName}
                  onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-bold"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Sales Associate)</option>
                  <option value="OWNER">OWNER (Full Admin Access)</option>
                </select>
              </div>
            </div>

            {editingUser && (
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Account is Active
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold"
              >
                Save Account
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
