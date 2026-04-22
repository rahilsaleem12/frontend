// =============================================
// Inventory.jsx
// =============================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

export function Inventory() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // { product, type: 'in'|'out' }
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search],
    queryFn: async () => {
      const p = new URLSearchParams({ pageSize: 200 });
      if (search) p.append('search', search);
      const r = await api.get(`/products?${p}`);
      return r.data.data;
    }
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, qty, type, notes }) =>
      api.post(`/products/${id}/stock-adjustment`, { quantity: +qty, type, notes }),
    onSuccess: () => { toast.success('Stock updated'); qc.invalidateQueries(['inventory']); setModal(null); setQty(''); setNotes(''); },
    onError: () => toast.error('Failed to update stock')
  });

  const products = data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
      </div>

      {/* Low stock summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Products', value: products.length, color: 'var(--info)', icon: '📦' },
          { label: 'Low Stock', value: products.filter(p => p.currentStock > 0 && p.currentStock <= p.minimumStock).length, color: 'var(--warning)', icon: '⚠️' },
          { label: 'Out of Stock', value: products.filter(p => p.currentStock <= 0).length, color: 'var(--danger)', icon: '❌' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>{s.icon}</span>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="page-loader"><div className="pos-spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => {
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minimumStock;
                  const isOut = p.currentStock <= 0;
                  return (
                    <tr key={p.id} style={{ background: isOut ? 'rgba(231,76,60,0.04)' : isLow ? 'rgba(243,156,18,0.04)' : '' }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        {p.barcode && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.barcode}</div>}
                      </td>
                      <td><span className="badge badge-muted">{p.category?.name}</span></td>
                      <td>
                        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '16px', color: isOut ? 'var(--danger)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                          {p.currentStock?.toFixed(3)} {p.unit?.abbreviation}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{p.minimumStock} {p.unit?.abbreviation}</td>
                      <td>
                        {isOut ? <span className="badge badge-danger">Out of Stock</span>
                          : isLow ? <span className="badge badge-warning">Low Stock</span>
                          : <span className="badge badge-success">Available</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-success btn-sm" onClick={() => { setModal({ product: p, type: 'StockIn' }); setQty(''); setNotes(''); }}>+ Stock In</button>
                          <button className="btn btn-danger btn-sm" onClick={() => { setModal({ product: p, type: 'StockOut' }); setQty(''); setNotes(''); }}>− Stock Out</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustment Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">{modal.type === 'StockIn' ? '📥 Stock In' : '📤 Stock Out'}</span>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700 }}>{modal.product.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current: {modal.product.currentStock} {modal.product.unit?.abbreviation}</div>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Quantity *</label>
                <input className="form-control" type="number" step="0.001" min="0" value={qty} onChange={(e) => setQty(e.target.value)}
                  placeholder="Enter quantity" autoFocus style={{ fontSize: '20px', textAlign: 'center', fontWeight: 700 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className={`btn ${modal.type === 'StockIn' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => adjustMutation.mutate({ id: modal.product.id, qty, type: modal.type, notes })}
                disabled={!qty || adjustMutation.isPending}>
                {adjustMutation.isPending ? 'Updating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;

// =============================================
// Customers.jsx
// =============================================
export function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, data: null });
  const [ledgerModal, setLedgerModal] = useState(null);
  const [paymentModal, setPaymentModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', creditLimit: 0 });

  React.useEffect(() => { if (modal.data) setForm(modal.data); else setForm({ name: '', phone: '', email: '', address: '', creditLimit: 0 }); }, [modal.data]);

  const { data } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get(`/customers?search=${search}&pageSize=50`).then(r => r.data.data)
  });

  const { data: ledger } = useQuery({
    queryKey: ['customer-ledger', ledgerModal?.id],
    queryFn: () => api.get(`/customers/${ledgerModal.id}/ledger`).then(r => r.data.data),
    enabled: !!ledgerModal
  });

  const saveMutation = useMutation({
    mutationFn: (d) => modal.data?.id ? api.put(`/customers/${modal.data.id}`, d) : api.post('/customers', d),
    onSuccess: () => { toast.success('Customer saved'); qc.invalidateQueries(['customers']); setModal({ open: false, data: null }); }
  });

  const payMutation = useMutation({
    mutationFn: (d) => api.post(`/customers/${paymentModal.id}/payment`, d),
    onSuccess: () => { toast.success('Payment recorded'); qc.invalidateQueries(['customers']); setPaymentModal(null); setPayAmount(''); }
  });

  const customers = data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Customers</h2>
          <p style={{ fontSize: '14px' }}>Manage customers & Udhaar (credit)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, data: null })}>＋ Add Customer</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800 }}>{customers.length}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Customers</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800, color: 'var(--danger)' }}>
            ₨ {customers.reduce((s, c) => s + (c.currentBalance || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Udhaar</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontFamily: 'Syne', fontSize: '22px', fontWeight: 800, color: 'var(--warning)' }}>
            {customers.filter(c => c.currentBalance > 0).length}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pending Balances</div>
        </div>
      </div>

      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead><tr><th>Customer</th><th>Phone</th><th>Credit Limit</th><th>Outstanding (Udhaar)</th><th>Actions</th></tr></thead>
            <tbody>
              {customers.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No customers found</td></tr>
                : customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.email}</div>
                    </td>
                    <td>{c.phone}</td>
                    <td>₨ {c.creditLimit?.toLocaleString()}</td>
                    <td>
                      {c.currentBalance > 0
                        ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>₨ {c.currentBalance?.toLocaleString()}</span>
                        : <span style={{ color: 'var(--success)' }}>₨ 0</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setLedgerModal(c)}>Ledger</button>
                        {c.currentBalance > 0 && (
                          <button className="btn btn-success btn-sm" onClick={() => { setPaymentModal(c); setPayAmount(''); }}>💰 Pay</button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ open: true, data: c })}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal({ open: false, data: null })}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal.data ? 'Edit' : 'Add'} Customer</span>
              <button className="modal-close" onClick={() => setModal({ open: false, data: null })}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[['Name *', 'name', 'text'], ['Phone', 'phone', 'tel'], ['Email', 'email', 'email'], ['Address', 'address', 'text']].map(([l, k, t]) => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{l}</label>
                    <input className="form-control" type={t} value={form[k] || ''} onChange={(e) => setForm(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Credit Limit (Udhaar Limit)</label>
                  <input className="form-control" type="number" value={form.creditLimit || 0} onChange={(e) => setForm(p => ({ ...p, creditLimit: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, data: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.name}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Modal */}
      {ledgerModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setLedgerModal(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">📋 {ledgerModal.name} — Ledger</span>
              <button className="modal-close" onClick={() => setLedgerModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Outstanding Balance</span>
                <span style={{ fontWeight: 800, color: 'var(--danger)', fontFamily: 'Syne', fontSize: '18px' }}>₨ {ledgerModal.currentBalance?.toLocaleString()}</span>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
                  <tbody>
                    {(ledger || []).map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '12px' }}>{new Date(l.transactionDate).toLocaleDateString()}</td>
                        <td><span className="badge badge-muted">{l.transactionType}</span></td>
                        <td style={{ color: 'var(--danger)' }}>{l.debit > 0 ? `₨ ${l.debit?.toFixed(2)}` : '—'}</td>
                        <td style={{ color: 'var(--success)' }}>{l.credit > 0 ? `₨ ${l.credit?.toFixed(2)}` : '—'}</td>
                        <td style={{ fontWeight: 600 }}>₨ {l.balance?.toFixed(2)}</td>
                      </tr>
                    ))}
                    {!ledger?.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No transactions</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setPaymentModal(null)}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">💰 Record Payment — {paymentModal.name}</span>
              <button className="modal-close" onClick={() => setPaymentModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Outstanding</div>
                <div style={{ fontFamily: 'Syne', fontSize: '28px', fontWeight: 800, color: 'var(--danger)' }}>₨ {paymentModal.currentBalance?.toFixed(2)}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Amount</label>
                <input className="form-control" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="Enter amount" autoFocus style={{ fontSize: '20px', textAlign: 'center', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                {[500, 1000, 2000, paymentModal.currentBalance].map((a, i) => (
                  <button key={i} className="quick-amount-btn" onClick={() => setPayAmount(a)}>{a === paymentModal.currentBalance ? 'Full' : a}</button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => payMutation.mutate({ amount: +payAmount, notes: '' })}
                disabled={!payAmount || payMutation.isPending}>
                {payMutation.isPending ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Suppliers.jsx
// =============================================
export function Suppliers() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, data: null });
  const [ledgerModal, setLedgerModal] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', address: '' });
  const [search, setSearch] = useState('');

  React.useEffect(() => { setForm(modal.data || { name: '', company: '', phone: '', email: '', address: '' }); }, [modal.data]);

  const { data } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => api.get(`/suppliers?search=${search}`).then(r => r.data.data)
  });

  const { data: ledger } = useQuery({
    queryKey: ['supplier-ledger', ledgerModal?.id],
    queryFn: () => api.get(`/suppliers/${ledgerModal.id}/ledger`).then(r => r.data.data),
    enabled: !!ledgerModal
  });

  const saveMutation = useMutation({
    mutationFn: (d) => modal.data?.id ? api.put(`/suppliers/${modal.data.id}`, d) : api.post('/suppliers', d),
    onSuccess: () => { toast.success('Supplier saved'); qc.invalidateQueries(['suppliers']); setModal({ open: false, data: null }); }
  });

  const suppliers = data || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Suppliers</h2>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, data: null })}>＋ Add Supplier</button>
      </div>

      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input className="form-control" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead><tr><th>Supplier</th><th>Contact</th><th>Outstanding</th><th>Actions</th></tr></thead>
            <tbody>
              {suppliers.length === 0
                ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No suppliers found</td></tr>
                : suppliers.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.company}</div>
                    </td>
                    <td>
                      <div>{s.phone}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.email}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: s.currentBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₨ {s.currentBalance?.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setLedgerModal(s)}>Ledger</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ open: true, data: s })}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal.open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal({ open: false, data: null })}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal.data ? 'Edit' : 'Add'} Supplier</span>
              <button className="modal-close" onClick={() => setModal({ open: false, data: null })}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[['Name *', 'name'], ['Company', 'company'], ['Phone', 'phone'], ['Email', 'email'], ['Address', 'address']].map(([l, k]) => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{l}</label>
                    <input className="form-control" value={form[k] || ''} onChange={(e) => setForm(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, data: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {ledgerModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setLedgerModal(null)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">📋 {ledgerModal.name} — Ledger</span>
              <button className="modal-close" onClick={() => setLedgerModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <div className="table-container">
                <table>
                  <thead><tr><th>Date</th><th>Type</th><th>Debit</th><th>Credit</th><th>Balance</th><th>Notes</th></tr></thead>
                  <tbody>
                    {(ledger || []).map((l, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: '12px' }}>{new Date(l.transactionDate).toLocaleDateString()}</td>
                        <td><span className="badge badge-muted">{l.transactionType}</span></td>
                        <td style={{ color: 'var(--danger)' }}>{l.debit > 0 ? `₨ ${l.debit?.toFixed(2)}` : '—'}</td>
                        <td style={{ color: 'var(--success)' }}>{l.credit > 0 ? `₨ ${l.credit?.toFixed(2)}` : '—'}</td>
                        <td style={{ fontWeight: 600 }}>₨ {l.balance?.toFixed(2)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.notes}</td>
                      </tr>
                    ))}
                    {!ledger?.length && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No transactions</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Expenses.jsx
// =============================================
export function Expenses() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ categoryId: '', title: '', amount: '', paymentMethod: 'Cash', notes: '', expenseDate: new Date().toISOString().slice(0, 10) });
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) });

  const { data: cats } = useQuery({ queryKey: ['expense-cats'], queryFn: () => api.get('/expenses/categories').then(r => r.data.data) });
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses', dateRange],
    queryFn: () => api.get(`/expenses?startDate=${dateRange.start}&endDate=${dateRange.end}`).then(r => r.data.data)
  });

  const saveMutation = useMutation({
    mutationFn: (d) => api.post('/expenses', d),
    onSuccess: () => { toast.success('Expense added'); qc.invalidateQueries(['expenses']); setModal(false); setForm({ categoryId: '', title: '', amount: '', paymentMethod: 'Cash', notes: '', expenseDate: new Date().toISOString().slice(0, 10) }); }
  });

  const list = expenses || [];
  const total = list.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2>Expenses</h2>
          <p style={{ fontSize: '14px' }}>Total: <strong style={{ color: 'var(--orange)' }}>₨ {total.toLocaleString()}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ Add Expense</button>
      </div>

      {/* Date Filter */}
      <div className="card" style={{ padding: '14px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">From</label>
            <input className="form-control" type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))} />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">To</label>
            <input className="form-control" type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="page-loader"><div className="pos-spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>Title</th><th>Category</th><th>Amount</th><th>Payment</th><th>Date</th><th>By</th></tr></thead>
              <tbody>
                {list.length === 0
                  ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No expenses found</td></tr>
                  : list.map(e => (
                    <tr key={e.id}>
                      <td><div style={{ fontWeight: 600 }}>{e.title}</div>{e.notes && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{e.notes}</div>}</td>
                      <td><span className="badge badge-muted">{e.category?.name}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₨ {e.amount?.toLocaleString()}</td>
                      <td>{e.paymentMethod}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(e.expenseDate).toLocaleDateString()}</td>
                      <td style={{ fontSize: '12px' }}>{e.user?.fullName}</td>
                    </tr>
                  ))}
              </tbody>
              {list.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--bg-elevated)' }}>
                    <td colSpan={2} style={{ fontWeight: 700, padding: '12px 16px' }}>Total</td>
                    <td style={{ fontWeight: 800, color: 'var(--danger)', fontFamily: 'Syne', fontSize: '16px' }}>₨ {total.toLocaleString()}</td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">➕ Add Expense</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Electricity Bill" autoFocus />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={form.categoryId} onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                      <option value="">Select...</option>
                      {(cats || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount *</label>
                    <input className="form-control" type="number" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-control" value={form.paymentMethod} onChange={(e) => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                      {['Cash', 'Card', 'BankTransfer', 'MobileWallet'].map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input className="form-control" type="date" value={form.expenseDate} onChange={(e) => setForm(p => ({ ...p, expenseDate: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-control" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={!form.title || !form.amount || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
