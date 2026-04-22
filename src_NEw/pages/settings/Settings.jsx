// =============================================
// Settings.jsx
// =============================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useSettingsStore, useAuthStore } from '../../services/api';

export default function Settings() {
  const { theme, toggleTheme } = useSettingsStore();
  const { user } = useAuthStore();
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirm: '' });

  const pwMutation = useMutation({
    mutationFn: (d) => api.post('/auth/change-password', d),
    onSuccess: () => { toast.success('Password changed'); setPwForm({ oldPassword: '', newPassword: '', confirm: '' }); },
    onError: () => toast.error('Failed to change password')
  });

  const handlePwChange = () => {
    if (!pwForm.oldPassword || !pwForm.newPassword) return toast.error('Fill all fields');
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 6) return toast.error('Min 6 characters');
    pwMutation.mutate({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword });
  };

  return (
    <div style={{ maxWidth: '700px' }}>
      <h2 style={{ marginBottom: '24px' }}>Settings</h2>

      {/* Profile */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><span className="card-title">👤 My Profile</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne', fontWeight: 800, fontSize: '28px', color: 'white'
          }}>{user?.fullName?.[0]}</div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '18px' }}>{user?.fullName}</div>
            <div style={{ color: 'var(--orange)', fontSize: '13px', fontWeight: 600 }}>{user?.role}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><span className="card-title">🎨 Appearance</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Theme</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Currently: {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</div>
          </div>
          <button className="btn btn-secondary" onClick={toggleTheme}>
            Switch to {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header"><span className="card-title">🔐 Change Password</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[['Current Password', 'oldPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirm']].map(([l, k]) => (
            <div className="form-group" key={k}>
              <label className="form-label">{l}</label>
              <input className="form-control" type="password" value={pwForm[k]} onChange={(e) => setPwForm(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handlePwChange} disabled={pwMutation.isPending}>
            {pwMutation.isPending ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* PWA */}
      <div className="card">
        <div className="card-header"><span className="card-title">📱 App & PWA</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Install as App</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Add to home screen for full-screen experience</div>
            </div>
            <button className="btn btn-primary btn-sm">Install</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Clear Cache</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Clear cached data and force refresh</div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => {
              if ('serviceWorker' in navigator) navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });
              toast.success('Cache cleared');
            }}>Clear</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Users.jsx
// =============================================
export function Users() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ roleId: 2, fullName: '', username: '', email: '', phone: '', password: '' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data.data)
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(r => r.data.data).catch(() => [{ id: 1, name: 'Admin' }, { id: 2, name: 'Manager' }, { id: 3, name: 'Cashier' }])
  });

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/users', d),
    onSuccess: () => { toast.success('User created'); qc.invalidateQueries(['users']); setModal(false); setForm({ roleId: 2, fullName: '', username: '', email: '', phone: '', password: '' }); }
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>User Management</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ Add User</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="page-loader"><div className="pos-spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>User</th><th>Username</th><th>Role</th><th>Last Login</th><th>Status</th></tr></thead>
              <tbody>
                {(users || []).map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', flexShrink: 0 }}>
                          {u.fullName?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-danger' : u.role === 'Manager' ? 'badge-warning' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                    </td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-muted'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">➕ Create User</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={form.roleId} onChange={(e) => setForm(p => ({ ...p, roleId: +e.target.value }))}>
                    {(roles || [{ id: 1, name: 'Admin' }, { id: 2, name: 'Manager' }, { id: 3, name: 'Cashier' }]).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                {[['Full Name *', 'fullName', 'text'], ['Username *', 'username', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'tel'], ['Password *', 'password', 'password']].map(([l, k, t]) => (
                  <div className="form-group" key={k}>
                    <label className="form-label">{l}</label>
                    <input className="form-control" type={t} value={form[k]} onChange={(e) => setForm(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => createMutation.mutate(form)}
                disabled={!form.fullName || !form.username || !form.password || createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Tables.jsx (Restaurant Table Management)
// =============================================
export function Tables() {
  const qc = useQueryClient();
  const [modal, setModal] = useState({ open: false, data: null });
  const [form, setForm] = useState({ tableNumber: '', capacity: 4, section: 'Indoor' });

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables-mgmt'],
    queryFn: () => api.get('/tables').then(r => r.data.data)
  });

  const saveMutation = useMutation({
    mutationFn: (d) => modal.data?.id ? api.put(`/tables/${modal.data.id}`, d) : api.post('/tables', d),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries(['tables-mgmt']); setModal({ open: false, data: null }); }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/tables/${id}/status`, JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } }),
    onSuccess: () => qc.invalidateQueries(['tables-mgmt'])
  });

  React.useEffect(() => { setForm(modal.data || { tableNumber: '', capacity: 4, section: 'Indoor' }); }, [modal.data]);

  const sections = [...new Set((tables || []).map(t => t.section))];
  const statusColor = { Available: 'var(--success)', Occupied: 'var(--danger)', Reserved: 'var(--warning)', Cleaning: 'var(--info)' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Restaurant Tables</h2>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, data: null })}>＋ Add Table</button>
      </div>

      {isLoading ? <div className="page-loader"><div className="pos-spinner" /></div> : (
        sections.length > 0 ? sections.map(sec => (
          <div key={sec} style={{ marginBottom: '24px' }}>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>📍 {sec}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
              {(tables || []).filter(t => t.section === sec).map(t => (
                <div key={t.id} className="card" style={{ padding: '16px', border: `2px solid ${statusColor[t.status] || 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '18px' }}>{t.tableNumber}</span>
                    <span style={{ fontSize: '22px' }}>🪑</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>Cap: {t.capacity}</div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: `${statusColor[t.status]}20`, color: statusColor[t.status], fontWeight: 600 }}>
                    {t.status}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '10px' }}>
                    <select style={{ flex: 1, fontSize: '11px', padding: '4px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}
                      value={t.status} onChange={(e) => statusMutation.mutate({ id: t.id, status: e.target.value })}>
                      {['Available', 'Occupied', 'Reserved', 'Cleaning'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}
                      onClick={() => setModal({ open: true, data: t })}>✏️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🪑</div>
            <div>No tables configured. Add your first table!</div>
          </div>
        )
      )}

      {modal.open && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal({ open: false, data: null })}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <span className="modal-title">{modal.data ? 'Edit' : 'Add'} Table</span>
              <button className="modal-close" onClick={() => setModal({ open: false, data: null })}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Table Number/Name *</label>
                  <input className="form-control" value={form.tableNumber} onChange={(e) => setForm(p => ({ ...p, tableNumber: e.target.value }))} placeholder="e.g. T-01, VIP-1" autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input className="form-control" type="number" min="1" value={form.capacity} onChange={(e) => setForm(p => ({ ...p, capacity: +e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input className="form-control" value={form.section} onChange={(e) => setForm(p => ({ ...p, section: e.target.value }))} placeholder="Indoor, Outdoor, VIP..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal({ open: false, data: null })}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveMutation.mutate(form)} disabled={!form.tableNumber || saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// Purchases.jsx
// =============================================
export function Purchases() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [items, setItems] = useState([{ productId: '', quantity: 1, unitCost: 0 }]);
  const [form, setForm] = useState({ supplierId: '', paidAmount: 0, paymentMethod: 'Cash', notes: '' });

  const { data: suppliers } = useQuery({ queryKey: ['suppliers-list'], queryFn: () => api.get('/suppliers').then(r => r.data.data) });
  const { data: products } = useQuery({ queryKey: ['products-list'], queryFn: () => api.get('/products?pageSize=500').then(r => r.data.data) });
  const { data: purchases, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => api.get('/purchases').then(r => r.data.data)
  });

  const saveMutation = useMutation({
    mutationFn: (d) => api.post('/purchases', d),
    onSuccess: () => {
      toast.success('Purchase recorded & stock updated');
      qc.invalidateQueries(['purchases']); qc.invalidateQueries(['products']);
      setModal(false); setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
      setForm({ supplierId: '', paidAmount: 0, paymentMethod: 'Cash', notes: '' });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save purchase')
  });

  const addItem = () => setItems(p => [...p, { productId: '', quantity: 1, unitCost: 0 }]);
  const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => setItems(p => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  const subTotal = items.reduce((s, i) => s + (i.quantity * i.unitCost), 0);

  const handleSubmit = () => {
    if (!form.supplierId) return toast.error('Select a supplier');
    if (items.some(i => !i.productId || !i.quantity)) return toast.error('Fill all items');
    saveMutation.mutate({ ...form, supplierId: +form.supplierId, paidAmount: +form.paidAmount, items: items.map(i => ({ productId: +i.productId, quantity: +i.quantity, unitCost: +i.unitCost })) });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Purchase Orders</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>＋ New Purchase</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? <div className="page-loader"><div className="pos-spinner" /></div> : (
          <div className="table-container">
            <table>
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Total</th><th>Paid</th><th>Due</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {(purchases || []).length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No purchases yet</td></tr>
                  : (purchases || []).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>{p.purchaseNumber}</td>
                      <td>{p.supplier?.name}</td>
                      <td style={{ fontWeight: 700 }}>₨ {p.totalAmount?.toLocaleString()}</td>
                      <td style={{ color: 'var(--success)' }}>₨ {p.paidAmount?.toLocaleString()}</td>
                      <td style={{ color: p.dueAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₨ {p.dueAmount?.toLocaleString()}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(p.purchaseDate).toLocaleDateString()}</td>
                      <td><span className="badge badge-success">{p.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModal(false)}>
          <div className="modal modal-lg" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <span className="modal-title">🚚 New Purchase Order</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <select className="form-control" value={form.supplierId} onChange={(e) => setForm(p => ({ ...p, supplierId: e.target.value }))}>
                    <option value="">Select supplier</option>
                    {(suppliers || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-control" value={form.paymentMethod} onChange={(e) => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                    {['Cash', 'Bank Transfer', 'Credit'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 700 }}>Purchase Items</span>
                  <button className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Item</button>
                </div>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <select className="form-control" value={item.productId} onChange={(e) => {
                      const p = (products || []).find(p => p.id === +e.target.value);
                      updateItem(i, 'productId', e.target.value);
                      if (p) updateItem(i, 'unitCost', p.purchasePrice || 0);
                    }}>
                      <option value="">Select product</option>
                      {(products || []).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input className="form-control" type="number" min="0" step="0.001" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} />
                    <input className="form-control" type="number" min="0" step="0.01" placeholder="Unit Cost" value={item.unitCost} onChange={(e) => updateItem(i, 'unitCost', e.target.value)} />
                    <button onClick={() => removeItem(i)} style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '8px 10px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>

              <div style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Syne', fontSize: '18px', fontWeight: 800 }}>
                  <span>Sub Total</span>
                  <span style={{ color: 'var(--orange)' }}>₨ {subTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Amount Paid</label>
                  <input className="form-control" type="number" min="0" value={form.paidAmount} onChange={(e) => setForm(p => ({ ...p, paidAmount: e.target.value }))} />
                </div>
                <div style={{ padding: '16px', background: form.paidAmount < subTotal ? 'var(--danger-bg)' : 'var(--success-bg)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due Amount</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: form.paidAmount < subTotal ? 'var(--danger)' : 'var(--success)' }}>
                    ₨ {Math.max(0, subTotal - form.paidAmount).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Notes</label>
                <input className="form-control" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : '✓ Record Purchase'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
