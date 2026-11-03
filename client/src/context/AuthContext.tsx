import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface SetupPayload {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setupRequired: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  initialSetup: (data: SetupPayload) => Promise<{ success: boolean; message?: string }>;
  checkSetupStatus: () => Promise<boolean>;
  logout: () => void;
  isOwner: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [setupRequired, setSetupRequired] = useState<boolean>(false);

  const checkSetupStatus = async (): Promise<boolean> => {
    try {
      const res = await api.get('/auth/setup-status');
      if (res.data.success) {
        const required = Boolean(res.data.data.setupRequired);
        setSetupRequired(required);
        return required;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('deep_pos_token');
      const savedUser = localStorage.getItem('deep_pos_user');

      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('deep_pos_token');
          localStorage.removeItem('deep_pos_user');
        }
      } else {
        await checkSetupStatus();
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data;
        setToken(newToken);
        setUser(newUser);
        setSetupRequired(false);
        localStorage.setItem('deep_pos_token', newToken);
        localStorage.setItem('deep_pos_user', JSON.stringify(newUser));

        // Cache last successful credentials securely for offline fallback login
        localStorage.setItem(
          `deep_offline_cache_${username}`,
          JSON.stringify({
            username,
            user: newUser,
            token: newToken,
            cachedAt: new Date().toISOString(),
          })
        );

        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error: any) {
      // Check offline cached credentials fallback
      const cached = localStorage.getItem(`deep_offline_cache_${username}`);
      if (cached && !navigator.onLine) {
        const data = JSON.parse(cached);
        setToken(data.token);
        setUser(data.user);
        setSetupRequired(false);
        return { success: true, message: 'Logged in using Offline Cached Session' };
      }

      const msg = error.response?.data?.message || error.message || 'Failed to connect to server';
      return { success: false, message: msg };
    }
  };

  const initialSetup = async (data: SetupPayload) => {
    try {
      const res = await api.post('/auth/setup', data);
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data.data;
        setToken(newToken);
        setUser(newUser);
        setSetupRequired(false);
        localStorage.setItem('deep_pos_token', newToken);
        localStorage.setItem('deep_pos_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, message: res.data.message || 'Setup failed' };
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Setup failed';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('deep_pos_token');
      localStorage.removeItem('deep_pos_user');
      checkSetupStatus();
    }
  };

  const isOwner = user?.role === 'OWNER';

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.role === 'OWNER') return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        setupRequired,
        login,
        initialSetup,
        checkSetupStatus,
        logout,
        isOwner,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
