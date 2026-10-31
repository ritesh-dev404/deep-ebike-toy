import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isOwner: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
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
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      if (response.data.success) {
        const { token: newToken, user: newUser } = response.data.data;
        setToken(newToken);
        setUser(newUser);
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
        return { success: true, message: 'Logged in using Offline Cached Session' };
      }

      const msg = error.response?.data?.message || error.message || 'Failed to connect to server';
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('deep_pos_token');
    localStorage.removeItem('deep_pos_user');
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
        login,
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
