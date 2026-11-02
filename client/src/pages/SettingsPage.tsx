import React, { useState, useEffect } from 'react';
import api, { API_BASE_URL } from '../api/client';
import {
  Settings,
  Database,
  Save,
  Download,
  CheckCircle,
  HardDrive,
  Printer,
  Store,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [lastBackupMsg, setLastBackupMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.put('/settings', settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    setBackupLoading(true);
    try {
      const res = await api.post('/settings/backup');
      if (res.data.success) {
        setLastBackupMsg(`Backup snapshot created successfully: ${res.data.data.fileName}`);
        fetchSettings();
      }
    } catch (err: any) {
      alert(err.message || 'Backup creation failed');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadDb = () => {
    window.open(`${API_BASE_URL}/settings/backup/download`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Shop Profile & System Configuration
        </h2>
        <p className="text-xs text-slate-500">
          Configure business details, invoice printing preferences, and database backups
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Shop settings updated successfully!</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile Card */}
        <div className="p-6 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Store Identity</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Registered Shop Name</label>
              <input
                type="text"
                value={settings.SHOP_NAME || ''}
                onChange={(e) => handleChange('SHOP_NAME', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Tagline / Slogan</label>
              <input
                type="text"
                value={settings.SHOP_TAGLINE || ''}
                onChange={(e) => handleChange('SHOP_TAGLINE', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">Store Physical Address</label>
            <input
              type="text"
              value={settings.SHOP_ADDRESS || ''}
              onChange={(e) => handleChange('SHOP_ADDRESS', e.target.value)}
              className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Contact Numbers</label>
              <input
                type="text"
                value={settings.SHOP_PHONE || ''}
                onChange={(e) => handleChange('SHOP_PHONE', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Store Email</label>
              <input
                type="email"
                value={settings.SHOP_EMAIL || ''}
                onChange={(e) => handleChange('SHOP_EMAIL', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">GSTIN</label>
              <input
                type="text"
                value={settings.SHOP_GSTIN || ''}
                onChange={(e) => handleChange('SHOP_GSTIN', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* Invoice & Print Settings */}
        <div className="p-6 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Printer className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Invoicing & Printers</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Invoice Prefix</label>
              <input
                type="text"
                value={settings.INVOICE_PREFIX || ''}
                onChange={(e) => handleChange('INVOICE_PREFIX', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Currency Symbol</label>
              <input
                type="text"
                value={settings.CURRENCY_SYMBOL || '₹'}
                onChange={(e) => handleChange('CURRENCY_SYMBOL', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Default Print Layout</label>
              <select
                value={settings.DEFAULT_PRINT_FORMAT || 'THERMAL_80MM'}
                onChange={(e) => handleChange('DEFAULT_PRINT_FORMAT', e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-slate-50 dark:bg-navy-900 border rounded-xl font-bold"
              >
                <option value="THERMAL_80MM">80mm Thermal Receipt (POS)</option>
                <option value="A4">Standard A4 Tax Invoice</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Configurations...' : 'Save All Settings'}</span>
        </button>
      </form>

      {/* Database Backup Section */}
      <div className="p-6 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Database className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Database Backup & Security</h3>
        </div>

        <p className="text-xs text-slate-500">
          Create an atomic local SQLite database snapshot or download the raw database file for offsite archiving.
        </p>

        {settings.LAST_BACKUP_TIME && (
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Last Successful Backup: <span className="font-mono font-bold">{new Date(settings.LAST_BACKUP_TIME).toLocaleString()}</span>
          </p>
        )}

        {lastBackupMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            ✓ {lastBackupMsg}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={backupLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-900 hover:bg-slate-800 dark:bg-orange-600 dark:hover:bg-orange-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            <HardDrive className="w-4 h-4" />
            <span>{backupLoading ? 'Creating Snapshot...' : 'Create Local Backup Snapshot'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDb}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Database File (.db)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
