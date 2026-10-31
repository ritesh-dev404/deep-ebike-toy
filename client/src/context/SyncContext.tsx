import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';

interface SyncContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  triggerSync: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await api.get('/sync/status');
      if (res.data.success) {
        setPendingCount(res.data.data.pendingQueueCount);
        setLastSyncedAt(res.data.data.lastSyncedAt);
      }
    } catch (e) {
      // Backend might be offline
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    refreshStatus();
    const interval = setInterval(refreshStatus, 20000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshStatus]);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      await api.post('/sync/trigger');
      await refreshStatus();
    } catch (e) {
      console.error('Manual sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount,
        lastSyncedAt,
        triggerSync,
        refreshStatus,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('useSync must be used within SyncProvider');
  return context;
};
