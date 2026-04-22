/* =============================================
   SmartPOS - Main Application
   ============================================= */
import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, useOnlineStore } from './services/api';
import { SyncManager } from './services/offlineDB';
import api from './services/api';
import Layout from './components/layout/Layout';
import './App.css';

// Lazy load pages for performance
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const POSScreen = lazy(() => import('./pages/pos/POSScreen'));
const Products = lazy(() => import('./pages/products/Products'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const Suppliers = lazy(() => import('./pages/suppliers/Suppliers'));
const Purchases = lazy(() => import('./pages/purchases/Purchases'));
const Expenses = lazy(() => import('./pages/expenses/Expenses'));
const Reports = lazy(() => import('./pages/reports/Reports'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Users = lazy(() => import('./pages/settings/Users'));
const Tables = lazy(() => import('./pages/settings/Tables'));
const Inventory = lazy(() => import('./pages/products/Inventory'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// Protected Route wrapper
const Protected = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

// Loading spinner
const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg-primary)'
  }}>
    <div className="pos-spinner" />
  </div>
);

function App() {
  const { isAuthenticated } = useAuthStore();
  const { setOnline } = useOnlineStore();

  useEffect(() => {
    // Online/offline listeners
    const handleOnline = () => {
      setOnline(true);
      const syncMgr = new SyncManager(api);
      syncMgr.syncWhenOnline();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial data sync when logged in
    if (isAuthenticated) {
      const syncMgr = new SyncManager(api);
      syncMgr.initialSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, setOnline]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
            } />

            <Route path="/" element={
              <Protected><Layout /></Protected>
            }>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<POSScreen />} />
              <Route path="products" element={<Products />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="customers" element={<Customers />} />
              <Route path="suppliers" element={
                <Protected roles={['Admin', 'Manager']}><Suppliers /></Protected>
              } />
              <Route path="purchases" element={
                <Protected roles={['Admin', 'Manager']}><Purchases /></Protected>
              } />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={
                <Protected roles={['Admin']}><Settings /></Protected>
              } />
              <Route path="settings/users" element={
                <Protected roles={['Admin']}><Users /></Protected>
              } />
              <Route path="settings/tables" element={
                <Protected roles={['Admin', 'Manager']}><Tables /></Protected>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '14px'
          },
          success: { iconTheme: { primary: '#FF6B35', secondary: '#fff' } }
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
