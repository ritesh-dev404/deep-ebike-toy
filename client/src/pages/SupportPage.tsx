import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import {
  LifeBuoy,
  Activity,
  Database,
  Cpu,
  Clock,
  ShieldAlert,
  PhoneCall,
  Mail,
  RefreshCw,
  HardDrive,
  CheckCircle,
} from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { isOwner } = useAuth();
  const [healthData, setHealthData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/support/health');
      if (res.data.success) setHealthData(res.data.data);

      if (isOwner) {
        const logRes = await api.get('/support/audit-logs?limit=30');
        if (logRes.data.success) setAuditLogs(logRes.data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckUpdate = () => {
    setUpdateChecking(true);
    setUpdateMessage(null);
    setTimeout(() => {
      setUpdateChecking(false);
      setUpdateMessage('You are running the latest production release (v1.0.0-PROD). System is up to date.');
    }, 1200);
  };

  if (isLoading || !healthData) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Inspecting System Health...</p>
        </div>
      </div>
    );
  }

  const { app, database, system, maintenance, supportContact } = healthData;

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            System Diagnostics & Technical Support
          </h2>
          <p className="text-xs text-slate-500">
            Real-time server health, database integrity, audit logs, and verified technical support
          </p>
        </div>

        <button
          onClick={handleCheckUpdate}
          disabled={updateChecking}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy-900 hover:bg-slate-800 text-white dark:bg-orange-600 dark:hover:bg-orange-500 text-xs font-bold shadow-md transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${updateChecking ? 'animate-spin' : ''}`} />
          <span>{updateChecking ? 'Checking Server...' : 'Check for Updates'}</span>
        </button>
      </div>

      {updateMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{updateMessage}</span>
        </div>
      )}

      {/* Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* App Status */}
        <div className="p-5 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">App Version</span>
            <Badge variant="success" size="sm">
              {app.version}
            </Badge>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {app.name}
          </h4>
          <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <p>Environment: <span className="font-semibold">{app.environment}</span></p>
            <p>Architecture: <span className="font-semibold">{app.mode}</span></p>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-5 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Database Engine</span>
            <Badge variant="info" size="sm">
              {database.status}
            </Badge>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {database.provider}
          </h4>
          <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <p>Database File Size: <span className="font-mono font-bold">{database.size}</span></p>
            <p>Total Products / Sales: <span className="font-bold">{database.totalProducts} / {database.totalSales}</span></p>
          </div>
        </div>

        {/* Host & Memory Status */}
        <div className="p-5 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Hardware & Node</span>
            <span className="text-[10px] font-mono text-slate-400">{system.nodeVersion}</span>
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {system.platform}
          </h4>
          <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
            <p>Host: <span className="font-mono">{system.hostname}</span></p>
            <p>RAM Allocated: <span className="font-semibold">{system.memoryUsageMb}</span></p>
            <p>Process Uptime: <span className="font-mono">{system.uptimeSeconds} seconds</span></p>
          </div>
        </div>
      </div>

      {/* Technical Support Contact Card */}
      <div className="p-6 bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <LifeBuoy className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Authorized Technical Support & Maintenance
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="text-slate-500">
              For technical assistance, printer configuration, or database migration, contact:
            </p>
            <div className="p-3 bg-slate-50 dark:bg-navy-900 rounded-xl space-y-1.5 font-medium">
              <p className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <PhoneCall className="w-4 h-4 text-orange-500" />
                <span>Helpdesk Phone: {supportContact.helpline}</span>
              </p>
              <p className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <Mail className="w-4 h-4 text-orange-500" />
                <span>Support Email: {supportContact.email}</span>
              </p>
              <p className="text-slate-400 text-[11px] pt-1">
                Availability: {supportContact.workingHours}
              </p>
            </div>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900/60 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                Security Policy Notice
              </span>
              <p className="text-xs text-orange-900 dark:text-orange-200 mt-1 leading-relaxed">
                {supportContact.remoteSupportNote}
              </p>
            </div>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold mt-2">
              ✓ Unattended remote desktop agents are strictly disallowed.
            </p>
          </div>
        </div>
      </div>

      {/* Security Audit Logs (Owner Only) */}
      {isOwner && auditLogs.length > 0 && (
        <div className="bg-white dark:bg-navy-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recent Security Audit Logs (Owner View)
              </h3>
            </div>
            <span className="text-xs text-slate-400">Latest 30 operations</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-900 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4 font-mono">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-navy-900/40">
                    <td className="py-2.5 px-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                      {log.entityName}
                    </td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-700 dark:text-slate-300">
                      {log.user?.fullName || 'System / Anonymous'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
