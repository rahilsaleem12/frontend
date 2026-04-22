// =============================================
// Layout.jsx - Sidebar + Header + Outlet
// =============================================
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore, useOnlineStore, useSettingsStore } from '../../services/api';
import toast from 'react-hot-toast';
import api from '../../services/api';

const NAV = [
  { section: 'MAIN' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['Admin', 'Manager', 'Cashier'] },
  { path: '/pos', label: 'POS / Billing', icon: '🛒', roles: ['Admin', 'Manager', 'Cashier'], highlight: true },
  { section: 'STOCK' },
  { path: '/products', label: 'Products', icon: '📦', roles: ['Admin', 'Manager', 'Cashier'] },
  { path: '/inventory', label: 'Inventory', icon: '🏪', roles: ['Admin', 'Manager'] },
  { path: '/purchases', label: 'Purchases', icon: '🚚', roles: ['Admin', 'Manager'] },
  { section: 'PEOPLE' },
  { path: '/customers', label: 'Customers', icon: '👥', roles: ['Admin', 'Manager', 'Cashier'] },
  { path: '/suppliers', label: 'Suppliers', icon: '🤝', roles: ['Admin', 'Manager'] },
  { section: 'FINANCE' },
  { path: '/expenses', label: 'Expenses', icon: '💸', roles: ['Admin', 'Manager', 'Cashier'] },
  { path: '/reports', label: 'Reports', icon: '📈', roles: ['Admin', 'Manager'] },
  { section: 'SYSTEM' },
  { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['Admin'] },
  { path: '/settings/users', label: 'Users', icon: '👤', roles: ['Admin'] },
  { path: '/settings/tables', label: 'Tables', icon: '🪑', roles: ['Admin', 'Manager'] },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/pos': 'POS — Point of Sale',
  '/products': 'Products',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/suppliers': 'Suppliers',
  '/purchases': 'Purchases',
  '/expenses': 'Expenses',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/settings/users': 'User Management',
  '/settings/tables': 'Table Management',
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { isOnline } = useOnlineStore();
  const { theme, toggleTheme } = useSettingsStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPOS = location.pathname === '/pos';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const filteredNav = NAV.filter(item =>
    item.section || !item.roles || item.roles.includes(user?.role)
  );

  const pageTitle = PAGE_TITLES[location.pathname] || 'SmartPOS';

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 150, backdropFilter: 'blur(2px)' }} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          {!collapsed && <span className="logo-text">Smart<span>POS</span></span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {filteredNav.map((item, i) => {
            if (item.section) {
              return <div key={i} className="nav-section-label">{item.section}</div>;
            }
            return (
              <NavLink key={item.path} to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'pos-nav' : ''}`}
                style={item.highlight ? { background: 'var(--orange-subtle)', color: 'var(--orange)' } : {}}>
                <span className="nav-icon" style={{ fontSize: '16px' }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* User info */}
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '8px'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '15px', color: 'white', flexShrink: 0
              }}>
                {user?.fullName?.[0]?.toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--orange)' }}>{user?.role}</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={toggleTheme} className="btn btn-ghost btn-icon" style={{ flex: collapsed ? 1 : 'none' }} title="Toggle Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {!collapsed && (
              <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--danger)' }}>
                🚪 Logout
              </button>
            )}
            {collapsed && (
              <button onClick={handleLogout} className="btn btn-ghost btn-icon" title="Logout" style={{ color: 'var(--danger)' }}>
                🚪
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${collapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        {!isPOS && (
          <header className={`header ${collapsed ? 'collapsed' : ''}`}>
            <div className="header-left">
              {/* Mobile menu toggle */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="btn btn-ghost btn-icon"
                style={{ display: 'none' }} id="mobile-menu-btn">☰</button>

              {/* Desktop collapse toggle */}
              <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost btn-icon" title="Toggle Sidebar">
                {collapsed ? '▶' : '◀'}
              </button>

              <h1 className="page-title">{pageTitle}</h1>
            </div>

            <div className="header-right">
              {/* Online Status */}
              <div className={`online-badge ${isOnline ? 'online' : 'offline'}`}>
                <span className="dot" />
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Branch */}
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '6px 12px',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-pill)' }}>
                🏪 {user?.branchName || 'Main Branch'}
              </div>

              {/* Date/Time */}
              <LiveClock />
            </div>
          </header>
        )}

        {/* POS has its own full-screen layout */}
        {isPOS ? (
          <div style={{ paddingTop: '0' }}>
            {/* POS Mini Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
              height: 'var(--header-height)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setCollapsed(!collapsed)} className="btn btn-ghost btn-icon">◀</button>
                <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '16px', color: 'var(--orange)' }}>
                  🛒 POS
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`online-badge ${isOnline ? 'online' : 'offline'}`}>
                  <span className="dot" />{isOnline ? 'Online' : 'Offline Mode'}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  👤 {user?.fullName}
                </span>
                <LiveClock />
              </div>
            </div>
            <Outlet />
          </div>
        ) : (
          <div className="page-container">
            <Outlet />
          </div>
        )}
      </main>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'Syne', fontWeight: 600 }}>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </div>
  );
}
