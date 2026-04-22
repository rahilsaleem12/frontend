import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../services/api';
import toast from 'react-hot-toast';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, logout } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!token && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [token, navigate, location]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!token) {
    return children;
  }

  const pageTitle = {
    '/pos': '🛒 POS',
    '/dashboard': '📊 Dashboard',
    '/products': '📦 Products',
    '/categories': '🏷️ Categories',
    '/customers': '👥 Customers',
    '/suppliers': '🚚 Suppliers',
    '/purchases': '📥 Purchases',
    '/expenses': '💸 Expenses',
    '/reports': '📈 Reports',
    '/settings': '⚙️ Settings',
    '/users': '👨‍💼 Users',
    '/tables': '🪑 Tables',
    '/inventory': '📊 Inventory',
  }[location.pathname] || 'SmartPOS';

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <h1 className="page-title">{pageTitle}</h1>
        </div>
        <div className="header-right">
          {/* Clock */}
          <div style={{
            fontSize: '12px',
            color: 'white',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            🕐 {time.toLocaleTimeString()}
          </div>

          {/* Online Status */}
          <div
            className={`online-badge ${!isOnline ? 'offline' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '4px 8px',
              borderRadius: '12px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              className="dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isOnline ? '#4ADE80' : '#FBBF24',
                display: 'inline-block',
              }}
            ></span>
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* User Menu */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '2px',
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'white',
              }}>
                {user?.fullName}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.8)',
              }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 150ms',
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        <div className="page-container">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
