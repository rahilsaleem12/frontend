// =============================================
// Reports.jsx — Full Reports Module
// =============================================
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#FF6B35', '#2ECC71', '#3498DB', '#9B59B6', '#F39C12', '#1ABC9C', '#E74C3C', '#34495E'];

const TAB_STYLES = (active) => ({
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '14px',
  transition: 'all 150ms',
  background: active ? 'var(--orange)' : 'transparent',
  color: active ? 'white' : 'var(--text-secondary)',
  boxShadow: active ? 'var(--shadow-orange)' : 'none',
});

const SummaryCard = ({ label, value, sub, color = 'var(--orange)' }) => (
  <div className="card" style={{ padding: '18px' }}>
    <div style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 800, color, marginBottom: '4px' }}>{value}</div>
    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
    {sub && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

const fmt = (n) => `₨ ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Reports() {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState('sales');
  const [dateRange, setDateRange] = useState({ start: monthStart, end: today });

  const TABS = [
    { id: 'sales', label: '📊 Sales' },
    { id: 'profit', label: '💰 Profit & Loss' },
    { id: 'daily', label: '📅 Daily Closing' },
    { id: 'stock', label: '📦 Stock' },
    { id: 'expenses', label: '💸 Expenses' },
  ];

  const { data: salesReport, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', dateRange],
    queryFn: () => api.get(`/reports/sales?startDate=${dateRange.start}&endDate=${dateRange.end}`).then(r => r.data.data),
    enabled: activeTab === 'sales',
  });

  const { data: plReport, isLoading: plLoading } = useQuery({
    queryKey: ['report-pl', dateRange],
    queryFn: () => api.get(`/reports/profit-loss?startDate=${dateRange.start}&endDate=${dateRange.end}`).then(r => r.data.data),
    enabled: activeTab === 'profit',
  });

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['report-daily', dateRange.end],
    queryFn: () => api.get(`/reports/daily-closing?date=${dateRange.end}`).then(r => r.data.data),
    enabled: activeTab === 'daily',
  });

  const { data: stockReport, isLoading: stockLoading } = useQuery({
    queryKey: ['report-stock'],
    queryFn: () => api.get('/reports/stock').then(r => r.data.data),
    enabled: activeTab === 'stock',
  });

  const { data: expenseReport, isLoading: expLoading } = useQuery({
    queryKey: ['report-expenses', dateRange],
    queryFn: () => api.get(`/reports/expenses?startDate=${dateRange.start}&endDate=${dateRange.end}`).then(r => r.data.data),
    enabled: activeTab === 'expenses',
  });

  const handlePrint = () => window.print();

  const DateFilter = () => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {[
        { label: 'Today', action: () => setDateRange({ start: today, end: today }) },
        { label: 'This Week', action: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); setDateRange({ start: d.toISOString().slice(0, 10), end: today }); } },
        { label: 'This Month', action: () => setDateRange({ start: monthStart, end: today }) },
        { label: 'Last 3 Months', action: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); setDateRange({ start: d.toISOString().slice(0, 10), end: today }); } },
      ].map(q => (
        <button key={q.label} onClick={q.action} className="btn btn-secondary btn-sm">{q.label}</button>
      ))}
      <div className="form-group">
        <label className="form-label">From</label>
        <input className="form-control" type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">To</label>
        <input className="form-control" type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} />
      </div>
      <button className="btn btn-secondary btn-sm" onClick={handlePrint}>🖨️ Print</button>
    </div>
  );

  const Loading = () => <div className="page-loader"><div className="pos-spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Reports & Analytics</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', padding: '6px', borderRadius: 'var(--radius-lg)', marginBottom: '20px', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.id} style={TAB_STYLES(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* Date Filter (for non-stock tabs) */}
      {activeTab !== 'stock' && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
          <DateFilter />
        </div>
      )}

      {/* ===== SALES REPORT ===== */}
      {activeTab === 'sales' && (
        salesLoading ? <Loading /> : !salesReport ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No data for selected period</div>
        ) : (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px', marginBottom: '20px' }}>
              <SummaryCard label="Total Sales" value={fmt(salesReport.totalSales)} sub={`${salesReport.totalOrders} orders`} color="var(--orange)" />
              <SummaryCard label="Net Sales" value={fmt(salesReport.netSales)} color="var(--success)" />
              <SummaryCard label="Tax Collected" value={fmt(salesReport.totalTax)} color="var(--info)" />
              <SummaryCard label="Total Discount" value={fmt(salesReport.totalDiscount)} color="var(--warning)" />
              <SummaryCard label="Avg. Order" value={fmt(salesReport.totalOrders > 0 ? salesReport.totalSales / salesReport.totalOrders : 0)} color="#9B59B6" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              {/* Sales by Date */}
              <div className="card">
                <div className="card-header"><span className="card-title">📅 Sales by Date</span></div>
                {salesReport.byDate?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={salesReport.byDate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => `₨ ${Number(v).toLocaleString()}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                      <Bar dataKey="sales" name="Sales" fill="#FF6B35" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="profit" name="Profit" fill="#2ECC71" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No data</div>}
              </div>

              {/* Sales by Category */}
              <div className="card">
                <div className="card-header"><span className="card-title">🏷️ By Category</span></div>
                {salesReport.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={salesReport.byCategory} dataKey="sales" nameKey="category" cx="40%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {salesReport.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => `₨ ${Number(v).toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No data</div>}
              </div>
            </div>

            {/* By User */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><span className="card-title">👤 Sales by Cashier</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Cashier</th><th>Orders</th><th>Sales</th></tr></thead>
                  <tbody>
                    {(salesReport.byUser || []).map((u, i) => (
                      <tr key={i}><td style={{ fontWeight: 600 }}>{u.user}</td><td>{u.orders}</td><td style={{ fontWeight: 700, color: 'var(--orange)' }}>{fmt(u.sales)}</td></tr>
                    ))}
                    {!salesReport.byUser?.length && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Customer */}
            <div className="card">
              <div className="card-header"><span className="card-title">👥 Sales by Customer</span></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Customer</th><th>Orders</th><th>Sales</th><th>Outstanding</th></tr></thead>
                  <tbody>
                    {(salesReport.byCustomer || []).map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{c.customer}</td>
                        <td>{c.orders}</td>
                        <td style={{ fontWeight: 700, color: 'var(--orange)' }}>{fmt(c.sales)}</td>
                        <td style={{ color: c.balance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(c.balance)}</td>
                      </tr>
                    ))}
                    {!salesReport.byCustomer?.length && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* ===== PROFIT & LOSS ===== */}
      {activeTab === 'profit' && (
        plLoading ? <Loading /> : !plReport ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No data</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '12px', marginBottom: '20px' }}>
              <SummaryCard label="Total Revenue" value={fmt(plReport.totalRevenue)} color="var(--orange)" />
              <SummaryCard label="Cost of Goods" value={fmt(plReport.totalCost)} color="var(--danger)" />
              <SummaryCard label="Gross Profit" value={fmt(plReport.grossProfit)} color="var(--success)" sub={`${plReport.grossMargin?.toFixed(1)}% margin`} />
              <SummaryCard label="Total Expenses" value={fmt(plReport.totalExpenses)} color="var(--warning)" />
              <SummaryCard label="Net Profit" value={fmt(plReport.netProfit)} color={plReport.netProfit >= 0 ? 'var(--success)' : 'var(--danger)'} sub={`${plReport.netMargin?.toFixed(1)}% margin`} />
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">📊 Profit & Loss Breakdown</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Total Revenue (Sales)', value: plReport.totalRevenue, color: 'var(--success)', type: 'income' },
                  { label: 'Cost of Goods Sold', value: plReport.totalCost, color: 'var(--danger)', type: 'expense' },
                  { label: 'Gross Profit', value: plReport.grossProfit, color: 'var(--info)', type: 'subtotal' },
                  { label: 'Operating Expenses', value: plReport.totalExpenses, color: 'var(--warning)', type: 'expense' },
                  { label: 'Net Profit / Loss', value: plReport.netProfit, color: plReport.netProfit >= 0 ? 'var(--success)' : 'var(--danger)', type: 'total' },
                ].map((row, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: row.type === 'total' ? 'var(--bg-elevated)' : row.type === 'subtotal' ? 'var(--orange-subtle)' : 'transparent',
                    fontWeight: ['subtotal', 'total'].includes(row.type) ? 700 : 400,
                    fontSize: row.type === 'total' ? '16px' : '14px'
                  }}>
                    <span style={{ color: 'var(--text-primary)' }}>{row.label}</span>
                    <span style={{ color: row.color, fontFamily: 'Syne', fontWeight: 700 }}>{fmt(row.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* ===== DAILY CLOSING ===== */}
      {activeTab === 'daily' && (
        dailyLoading ? <Loading /> : !dailyReport ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No data for selected date</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
              <SummaryCard label="Total Sales" value={fmt(dailyReport.totalSales)} color="var(--orange)" sub={`${dailyReport.totalOrders} orders`} />
              <SummaryCard label="Cash Sales" value={fmt(dailyReport.cashSales)} color="var(--success)" />
              <SummaryCard label="Card/Bank" value={fmt(dailyReport.cardSales)} color="var(--info)" />
              <SummaryCard label="Expenses" value={fmt(dailyReport.totalExpenses)} color="var(--danger)" />
              <SummaryCard label="Net Cash" value={fmt(dailyReport.netCash)} color="var(--warning)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="card">
                <div className="card-header"><span className="card-title">📋 Order Summary</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {[
                    { label: 'Completed Orders', value: dailyReport.completedOrders, unit: '' },
                    { label: 'Voided Orders', value: dailyReport.voidedOrders, unit: '' },
                    { label: 'Total Items Sold', value: dailyReport.totalItemsSold, unit: ' items' },
                    { label: 'Average Order Value', value: fmt(dailyReport.avgOrderValue), unit: '' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                      <span style={{ fontWeight: 700 }}>{r.value}{r.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">💳 Payment Breakdown</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {(dailyReport.paymentBreakdown || []).map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.method}</span>
                      <span style={{ fontWeight: 700, color: 'var(--orange)' }}>{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* ===== STOCK REPORT ===== */}
      {activeTab === 'stock' && (
        stockLoading ? <Loading /> : !stockReport ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No data</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
              <SummaryCard label="Total Products" value={stockReport.totalProducts} color="var(--orange)" />
              <SummaryCard label="Total Stock Value" value={fmt(stockReport.totalValue)} color="var(--success)" />
              <SummaryCard label="Low Stock Items" value={stockReport.lowStockCount} color="var(--warning)" />
              <SummaryCard label="Out of Stock" value={stockReport.outOfStockCount} color="var(--danger)" />
            </div>
            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Purchase Price</th><th>Stock Value</th><th>Status</th></tr></thead>
                  <tbody>
                    {(stockReport.items || []).map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td><span className="badge badge-muted">{p.category}</span></td>
                        <td>{p.currentStock} {p.unit}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{p.minimumStock}</td>
                        <td>{fmt(p.purchasePrice)}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(p.stockValue)}</td>
                        <td>
                          {p.currentStock <= 0 ? <span className="badge badge-danger">Out</span>
                            : p.currentStock <= p.minimumStock ? <span className="badge badge-warning">Low</span>
                            : <span className="badge badge-success">OK</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}

      {/* ===== EXPENSE REPORT ===== */}
      {activeTab === 'expenses' && (
        expLoading ? <Loading /> : !expenseReport ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No data</div>
        ) : (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '12px', marginBottom: '20px' }}>
              <SummaryCard label="Total Expenses" value={fmt(expenseReport.totalAmount)} color="var(--danger)" sub={`${expenseReport.totalCount} entries`} />
              <SummaryCard label="Highest Category" value={expenseReport.topCategory || '—'} color="var(--warning)" />
              <SummaryCard label="Avg. Daily" value={fmt(expenseReport.avgDaily)} color="var(--info)" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="card">
                <div className="card-header"><span className="card-title">📊 By Category</span></div>
                {expenseReport.byCategory?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={expenseReport.byCategory} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80}>
                        {expenseReport.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No data</div>}
              </div>

              <div className="card">
                <div className="card-header"><span className="card-title">📅 By Date</span></div>
                {expenseReport.byDate?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={expenseReport.byDate}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Line type="monotone" dataKey="amount" stroke="#E74C3C" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No data</div>}
              </div>
            </div>

            <div className="card" style={{ padding: 0 }}>
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th><th>Method</th><th>By</th></tr></thead>
                  <tbody>
                    {(expenseReport.items || []).map((e, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString()}</td>
                        <td style={{ fontWeight: 600 }}>{e.title}</td>
                        <td><span className="badge badge-muted">{e.category}</span></td>
                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(e.amount)}</td>
                        <td style={{ fontSize: '12px' }}>{e.paymentMethod}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.user}</td>
                      </tr>
                    ))}
                    {!expenseReport.items?.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No expenses</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
