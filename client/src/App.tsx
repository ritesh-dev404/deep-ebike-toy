import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PosPage } from './pages/PosPage';
import { ProductsPage } from './pages/ProductsPage';
import { StockPage } from './pages/StockPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';
import { SupportPage } from './pages/SupportPage';

export const App: React.FC = () => {
  const { user, isLoading, isOwner } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('pos');

  useEffect(() => {
    if (user) {
      // Default owner to dashboard, employee to POS
      setCurrentTab(isOwner ? 'dashboard' : 'pos');
    }
  }, [user, isOwner]);

  useEffect(() => {
    // Global hotkey F2 to jump directly to POS
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        setCurrentTab('pos');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigateToPos={() => setCurrentTab('pos')} />;
      case 'pos':
        return <PosPage />;
      case 'products':
        return <ProductsPage />;
      case 'stock':
        return <StockPage />;
      case 'purchases':
        return <PurchasesPage />;
      case 'customers':
        return <CustomersPage />;
      case 'reports':
        return <ReportsPage />;
      case 'users':
        return <UsersPage />;
      case 'settings':
        return <SettingsPage />;
      case 'support':
        return <SupportPage />;
      default:
        return <PosPage />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
