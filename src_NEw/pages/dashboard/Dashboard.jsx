// =============================================
// Dashboard.jsx
// =============================================
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ label, value, icon, color, sub, trend }) => (
  <div className="stat-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div className="stat-icon" style={{ background: `${color}18` }}>
        <span style={{ fontSize: '22px' }}>{icon}</span>
      </div>
      {trend !== undefined && (
        <span className={`stat-change ${trend >= 0 ? 'up' : 'down'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</div>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '12px 16px', minWidth: '140px', boxShadow: 'var(--shadow-md)' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '14px', fontWeight: 600 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  const fmt = (n) => n?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) ?? '—';

  if (isLoading) return (
    <div className="page-loader" style={{ paddingTop: '80px' }}>
      <div className="pos-spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }} />
    </div>
  );

  const stats = [
    { label: "Today's Sales", value: `₨ ${fmt(data?.todaySales)}`, icon: '💰', color: 'var(--orange)', sub: `${data?.todayOrders ?? 0} orders today`, trend: 12 },
    { label: "Today's Profit", value: `₨ ${fmt(data?.todayProfit)}`, icon: '📈', color: 'var(--success)', trend: 8 },
    { label: 'Month Sales', value: `₨ ${fmt(data?.monthSales)}`, icon: '📅', color: 'var(--info)', trend: 5 },
    { label: 'Today Expenses', value: `₨ ${fmt(data?.todayExpenses)}`, icon: '💸', color: 'var(--danger)', trend: -3 },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '24px' }}>
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {/* Monthly Sales Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Monthly Performance</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data?.monthlyData || []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#FF6B35" strokeWidth={2} fill="url(#salesGrad)" />
              <Area type="monotone" dataKey="profit" name="Profit" stroke="#2ECC71" strokeWidth={2} fill="url(#profitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🏆 Top Products</span>
          </div>
          {(data?.topProducts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No data yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(data?.topProducts || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 800, color: i < 3 ? '#000' : 'var(--text-muted)'
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Qty: {p.quantity}</div>
                  </div>
                  <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '13px', color: 'var(--orange)', flexShrink: 0 }}>
                    ₨{fmt(p.revenue)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Low Stock Alerts</span>
            <span style={{
              background: 'var(--danger-bg)', color: 'var(--danger)',
              padding: '3px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', fontWeight: 700
            }}>{data?.lowStockCount ?? 0}</span>
          </div>
          {(data?.lowStockProducts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--success)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontWeight: 600 }}>All stock levels OK</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '250px', overflowY: 'auto' }}>
              {(data?.lowStockProducts || []).map(p => (
                <div key={p.id} onClick={() => navigate('/inventory')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', border: '1px solid rgba(231,76,60,0.2)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min: {p.minimumStock} {p.unit}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '15px' }}>
                      {p.currentStock} {p.unit}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--danger)', opacity: 0.7 }}>Low Stock</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header"><span className="card-title">⚡ Quick Actions</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { label: 'New Sale', icon: '🛒', path: '/pos', color: 'var(--orange)' },
              { label: 'Add Product', icon: '📦', path: '/products', color: 'var(--info)' },
              { label: 'Add Customer', icon: '👥', path: '/customers', color: 'var(--success)' },
              { label: 'Add Expense', icon: '💸', path: '/expenses', color: 'var(--danger)' },
              { label: 'View Reports', icon: '📈', path: '/reports', color: 'var(--warning)' },
              { label: 'New Purchase', icon: '🚚', path: '/purchases', color: '#9B59B6' },
            ].map(a => (
              <button key={a.label} onClick={() => navigate(a.path)}
                style={{
                  padding: '14px', border: `1px solid ${a.color}30`, background: `${a.color}10`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center',
                  transition: 'all 150ms', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${a.color}20`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${a.color}10`; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <span style={{ fontSize: '22px' }}>{a.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: a.color }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
