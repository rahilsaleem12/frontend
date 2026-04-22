// =============================================
// POSScreen.jsx - Complete POS Billing Screen
// =============================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useCartStore, useSettingsStore, useOnlineStore } from '../../services/api';
import { offlineDB } from '../../services/offlineDB';

// ========== ICONS (inline SVG for performance) ==========
const Icons = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Grid: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  List: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Cart: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Table: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Minus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Percent: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  Printer: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Pause: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Play: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Barcode: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5v14M7 5v14M11 5v14M13 5v14M17 5v14M21 5v14M5 5H3M5 19H3M9 5H7M9 19H7M15 5h-2M15 19h-2M19 5h-2M19 19h-2M21 5h2M21 19h2"/></svg>,
  Split: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5M8 3H3v5M3 16v5h5M16 21h5v-5M21 3L3 21"/></svg>,
  ChefHat: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>,
};

// ========== PAYMENT MODAL ==========
const PaymentModal = ({ isOpen, onClose, onComplete, total, orderType }) => {
  const [payments, setPayments] = useState([{ method: 'Cash', amount: total, reference: '' }]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) setPayments([{ method: 'Cash', amount: total, reference: '' }]);
  }, [isOpen, total]);

  const totalPaid = payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  const change = totalPaid - total;
  const balance = total - totalPaid;

  const methods = [
    { id: 'Cash', label: 'Cash', icon: '💵' },
    { id: 'Card', label: 'Card', icon: '💳' },
    { id: 'BankTransfer', label: 'Bank', icon: '🏦' },
    { id: 'MobileWallet', label: 'Wallet', icon: '📱' },
    { id: 'Credit', label: 'Credit', icon: '📋' },
  ];

  const quickAmounts = [500, 1000, 2000, 5000];

  const updatePayment = (idx, field, value) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addSplitPayment = () => {
    setPayments(prev => [...prev, { method: 'Card', amount: balance > 0 ? balance : 0, reference: '' }]);
  };

  const handleSubmit = async () => {
    if (balance > 0 && payments[0].method !== 'Credit') {
      toast.error('Payment amount is less than total');
      return;
    }
    setProcessing(true);
    try {
      await onComplete(payments, change);
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">💳 Collect Payment</span>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          {/* Total */}
          <div style={{
            background: 'var(--orange-subtle)', border: '1px solid var(--border-orange)',
            borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Amount</div>
            <div style={{ fontFamily: 'Syne', fontSize: '36px', fontWeight: 800, color: 'var(--orange)' }}>
              {total.toFixed(2)}
            </div>
          </div>

          {/* Payments */}
          {payments.map((payment, idx) => (
            <div key={idx} style={{ marginBottom: '16px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {idx === 0 ? 'Payment' : `Split ${idx + 1}`}
                </span>
                {idx > 0 && (
                  <button onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '18px' }}>×</button>
                )}
              </div>

              <div className="payment-methods">
                {methods.map(m => (
                  <button key={m.id} className={`payment-method-btn ${payment.method === m.id ? 'selected' : ''}`}
                    onClick={() => updatePayment(idx, 'method', m.id)}>
                    <span className="pm-icon">{m.icon}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="form-group" style={{ marginTop: '12px' }}>
                <label className="form-label">Amount</label>
                <input type="number" className="form-control" value={payment.amount}
                  onChange={(e) => updatePayment(idx, 'amount', parseFloat(e.target.value) || 0)}
                  style={{ fontSize: '20px', fontWeight: 700, textAlign: 'right' }} />
                {idx === 0 && (
                  <div className="quick-amounts">
                    {quickAmounts.map(a => (
                      <button key={a} className="quick-amount-btn" onClick={() => updatePayment(0, 'amount', a)}>
                        {a.toLocaleString()}
                      </button>
                    ))}
                    <button className="quick-amount-btn" onClick={() => updatePayment(0, 'amount', total)}>Exact</button>
                  </div>
                )}
              </div>

              {(payment.method === 'Card' || payment.method === 'BankTransfer' || payment.method === 'MobileWallet') && (
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Reference / Transaction ID</label>
                  <input type="text" className="form-control" placeholder="Optional" value={payment.reference}
                    onChange={(e) => updatePayment(idx, 'reference', e.target.value)} />
                </div>
              )}
            </div>
          ))}

          <button onClick={addSplitPayment} className="btn btn-secondary btn-sm" style={{ marginBottom: '16px' }}>
            <Icons.Split /> Split Payment
          </button>

          {/* Summary */}
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '16px', border: '1px solid var(--border)' }}>
            <div className="total-row">
              <span>Total Amount</span>
              <span style={{ fontWeight: 700 }}>{total.toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Total Paid</span>
              <span style={{ fontWeight: 700, color: 'var(--success)' }}>{totalPaid.toFixed(2)}</span>
            </div>
            {change > 0 && (
              <div className="total-row" style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '16px' }}>
                <span>Change</span>
                <span>{change.toFixed(2)}</span>
              </div>
            )}
            {balance > 0 && payments[0]?.method !== 'Credit' && (
              <div className="total-row" style={{ color: 'var(--danger)', fontWeight: 700 }}>
                <span>Remaining</span>
                <span>{balance.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={processing || (balance > 0 && payments[0]?.method !== 'Credit')}>
            {processing ? '⏳ Processing...' : `✓ Complete Sale`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ========== CUSTOMER PICKER MODAL ==========
const CustomerModal = ({ isOpen, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        if (navigator.onLine) {
          const res = await api.get(`/customers?search=${search}&pageSize=20`);
          setCustomers(res.data.data);
        } else {
          const offline = await offlineDB.searchCustomers(search);
          setCustomers(offline);
        }
      } catch { }
      setLoading(false);
    };
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [isOpen, search]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">👤 Select Customer</span>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          <div className="search-input-wrapper" style={{ marginBottom: '16px' }}>
            <span className="search-icon"><Icons.Search /></span>
            <input className="form-control" placeholder="Search by name or phone..."
              value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>

          {loading ? <div className="page-loader"><div className="pos-spinner" /></div> : (
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <div onClick={() => onSelect(null)}
                style={{ padding: '12px', cursor: 'pointer', borderRadius: 'var(--radius-md)', marginBottom: '4px',
                  background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '20px' }}>🚶</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Walk-in Customer</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No customer record</div>
                </div>
              </div>
              {customers.map(c => (
                <div key={c.id} onClick={() => onSelect(c)}
                  style={{ padding: '12px', cursor: 'pointer', borderRadius: 'var(--radius-md)', marginBottom: '4px',
                    border: '1px solid var(--border)', transition: 'all 150ms' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--orange)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.phone}</div>
                    </div>
                    {c.currentBalance > 0 && (
                      <span className="badge badge-danger">Udhaar: {c.currentBalance.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ========== TABLE PICKER MODAL ==========
const TableModal = ({ isOpen, onClose, onSelect }) => {
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      if (!navigator.onLine) return offlineDB.getTables();
      const res = await api.get('/tables');
      return res.data.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  const sections = [...new Set((tables || []).map(t => t.section))];
  const statusColor = { Available: 'var(--success)', Occupied: 'var(--danger)', Reserved: 'var(--warning)', Cleaning: 'var(--info)' };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <span className="modal-title">🪑 Select Table</span>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          {sections.map(section => (
            <div key={section} style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px',
                textTransform: 'uppercase', letterSpacing: '0.1em' }}>{section}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                {(tables || []).filter(t => t.section === section).map(table => (
                  <button key={table.id} onClick={() => table.status === 'Available' && onSelect(table)}
                    style={{
                      padding: '16px 8px', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${statusColor[table.status] || 'var(--border)'}`,
                      background: table.status === 'Available' ? 'var(--success-bg)' : 'var(--bg-elevated)',
                      cursor: table.status === 'Available' ? 'pointer' : 'not-allowed',
                      opacity: table.status === 'Available' ? 1 : 0.6,
                      textAlign: 'center'
                    }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>🪑</div>
                    <div style={{ fontWeight: 700, fontSize: '14px' }}>{table.tableNumber}</div>
                    <div style={{ fontSize: '11px', color: statusColor[table.status] }}>{table.status}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cap: {table.capacity}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ========== HOLD ORDERS MODAL ==========
const HeldOrdersModal = ({ isOpen, onClose, onResume }) => {
  const [heldOrders, setHeldOrders] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const loadHeld = async () => {
        const offline = await offlineDB.getHeldOrders();
        setHeldOrders(offline);
      };
      loadHeld();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">⏸ Held Orders</span>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          {heldOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
              <div>No held orders</div>
            </div>
          ) : (
            heldOrders.map(order => (
              <div key={order.id} style={{ padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{order.heldAt?.substring(11, 16) || 'Held Order'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.items?.length || 0} items</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { onResume(order); onClose(); }}>
                  Resume
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ========== DISCOUNT MODAL ==========
const DiscountModal = ({ isOpen, onClose, onApply, currentDiscount }) => {
  const [type, setType] = useState(currentDiscount?.type || 'Percent');
  const [value, setValue] = useState(currentDiscount?.value || '');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <span className="modal-title">🏷 Apply Discount</span>
          <button className="modal-close" onClick={onClose}><Icons.X /></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['Percent', 'Fixed'].map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`btn ${type === t ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1 }}>
                {t === 'Percent' ? '% Percent' : '# Fixed'}
              </button>
            ))}
          </div>
          <div className="form-group">
            <label className="form-label">Discount {type === 'Percent' ? '(%)' : '(Amount)'}</label>
            <input type="number" className="form-control" value={value}
              onChange={(e) => setValue(e.target.value)} placeholder={type === 'Percent' ? '0-100' : '0.00'} autoFocus
              style={{ fontSize: '24px', textAlign: 'center', fontWeight: 700 }} />
          </div>
          {type === 'Percent' && (
            <div className="quick-amounts" style={{ justifyContent: 'center', marginTop: '12px' }}>
              {[5, 10, 15, 20, 25].map(v => (
                <button key={v} className="quick-amount-btn" onClick={() => setValue(v)}>{v}%</button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => { onApply(null, 0); onClose(); }}>Remove</button>
          <button className="btn btn-primary" onClick={() => { onApply(type, parseFloat(value) || 0); onClose(); }}>Apply</button>
        </div>
      </div>
    </div>
  );
};

// ========== RECEIPT TEMPLATE ==========
const ReceiptTemplate = ({ order, branch }) => (
  <div className="receipt-print" style={{
    fontFamily: "'Courier New', monospace", fontSize: '12px', width: '80mm',
    background: 'white', color: '#000', padding: '8px'
  }}>
    <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{branch?.name || 'SmartPOS'}</div>
      <div>{branch?.address}</div>
      <div>{branch?.phone}</div>
    </div>
    <div style={{ marginBottom: '8px' }}>
      <div><b>Order:</b> {order.orderNumber}</div>
      <div><b>Date:</b> {new Date().toLocaleString()}</div>
      {order.customer && <div><b>Customer:</b> {order.customer.name}</div>}
      {order.table && <div><b>Table:</b> {order.table.tableNumber}</div>}
      <div><b>Type:</b> {order.orderType}</div>
      <div><b>Cashier:</b> {order.cashier}</div>
    </div>
    <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '8px 0', marginBottom: '8px' }}>
      {order.items?.map((item, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{item.name} x{item.quantity}</span>
          <span>{(item.unitPrice * item.quantity).toFixed(2)}</span>
        </div>
      ))}
    </div>
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{order.subTotal?.toFixed(2)}</span></div>
      {order.taxAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{order.taxAmount?.toFixed(2)}</span></div>}
      {order.discountAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount</span><span>-{order.discountAmount?.toFixed(2)}</span></div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed #000', marginTop: '4px', paddingTop: '4px' }}>
        <span>TOTAL</span><span>{order.totalAmount?.toFixed(2)}</span>
      </div>
      {order.changeAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Change</span><span>{order.changeAmount?.toFixed(2)}</span></div>}
    </div>
    <div style={{ textAlign: 'center', marginTop: '12px', borderTop: '1px dashed #000', paddingTop: '8px' }}>
      <div>Thank you for your visit!</div>
      <div style={{ fontSize: '10px', marginTop: '4px' }}>Powered by SmartPOS</div>
    </div>
  </div>
);

// ========== MAIN POS SCREEN ==========
export default function POSScreen() {
  const { productView, setProductView } = useSettingsStore();
  const isOnline = useOnlineStore(s => s.isOnline);
  const cart = useCartStore();
  const qc = useQueryClient();
  const searchRef = useRef(null);
  const barcodeRef = useRef(null);
  const receiptRef = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [showHeld, setShowHeld] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Products query
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['pos-products', selectedCategory, search],
    queryFn: async () => {
      if (!navigator.onLine) {
        const offline = await offlineDB.getProducts();
        return offline.filter(p => p.isActive &&
          (!selectedCategory || p.categoryId === selectedCategory) &&
          (!search || p.name?.toLowerCase().includes(search.toLowerCase()))
        );
      }
      const params = new URLSearchParams({ pageSize: '200' });
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (search) params.append('search', search);
      const res = await api.get(`/products?${params}`);
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000
  });

  // Categories query
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!navigator.onLine) return offlineDB.getCategories();
      const res = await api.get('/categories');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000
  });

  // Barcode scan listener
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimer = null;

    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' && e.target !== barcodeRef.current) return;
      if (e.key === 'Enter' && barcodeBuffer.length > 3) {
        handleBarcodeSearch(barcodeBuffer);
        barcodeBuffer = '';
        return;
      }
      if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(barcodeTimer);
        barcodeTimer = setTimeout(() => { barcodeBuffer = ''; }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const handleBarcodeSearch = async (barcode) => {
    try {
      let product;
      if (!navigator.onLine) {
        product = await offlineDB.getProductByBarcode(barcode);
      } else {
        const res = await api.get(`/products/barcode/${barcode}`);
        product = res.data.data;
      }
      if (product) {
        cart.addItem(product);
        toast.success(`Added: ${product.name}`, { duration: 1500 });
      } else {
        toast.error('Product not found');
      }
    } catch {
      toast.error('Product not found');
    }
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async ({ payments, change }) => {
      const orderData = {
        customerId: cart.customer?.id,
        tableId: cart.table?.id,
        orderType: cart.orderType,
        discountType: cart.discountType,
        discountValue: cart.discountValue,
        notes: cart.notes,
        items: cart.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
          notes: item.notes
        })),
        payments: payments.map(p => ({
          paymentMethod: p.method,
          amount: p.amount,
          reference: p.reference
        }))
      };

      if (!navigator.onLine) {
        const localId = await offlineDB.savePendingOrder(orderData);
        return { localId, ...orderData, totalAmount: cart.total, changeAmount: change, status: 'offline' };
      }

      const res = await api.post('/orders', orderData);
      const order = res.data.data;
      await api.post(`/orders/${order.id}/complete`);
      return { ...order, changeAmount: change };
    },
    onSuccess: (order) => {
      setLastOrder(order);
      setShowPayment(false);
      cart.clearCart();
      qc.invalidateQueries(['pos-products']);
      toast.success(order.status === 'offline'
        ? '📴 Order saved offline - will sync when connected'
        : `✅ Sale complete! Change: ${order.changeAmount?.toFixed(2) || 0}`
      );
      // Auto print receipt
      setTimeout(() => window.print(), 500);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process order');
    }
  });

  const handleSendKOT = async () => {
    if (cart.items.length === 0) return toast.error('Cart is empty');
    try {
      const orderData = {
        customerId: cart.customer?.id,
        tableId: cart.table?.id,
        orderType: cart.orderType,
        items: cart.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discountAmount: i.discountAmount })),
        payments: []
      };
      const res = await api.post('/orders', orderData);
      await api.post(`/orders/${res.data.data.id}/kot`);
      toast.success('🍳 KOT sent to kitchen!');
    } catch {
      toast.error('Failed to send KOT');
    }
  };

  const handleHoldCart = async () => {
    if (cart.items.length === 0) return;
    await offlineDB.saveHeldOrder({
      items: cart.items, customer: cart.customer, table: cart.table,
      orderType: cart.orderType, discountType: cart.discountType, discountValue: cart.discountValue
    });
    cart.clearCart();
    toast.success('Order held');
  };

  const handleResumeOrder = (heldOrder) => {
    cart.clearCart();
    heldOrder.items?.forEach(item => cart.addItem({ id: item.productId, name: item.name, salePrice: item.unitPrice, taxRate: item.taxRate, imageUrl: item.imageUrl }));
    if (heldOrder.customer) cart.setCustomer(heldOrder.customer);
    if (heldOrder.table) cart.setTable(heldOrder.table);
    cart.setOrderType(heldOrder.orderType || 'Takeaway');
  };

  const handleTempBill = () => {
    // Show a preview print
    const tempData = {
      orderNumber: 'TEMP-BILL',
      orderType: cart.orderType,
      customer: cart.customer,
      table: cart.table,
      cashier: 'Current User',
      items: cart.items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
      subTotal: cart.subTotal,
      taxAmount: cart.taxAmount,
      discountAmount: cart.orderDiscount + cart.itemDiscounts,
      totalAmount: cart.total,
      changeAmount: 0
    };
    setLastOrder(tempData);
    setTimeout(() => window.print(), 100);
    toast.success('Temp bill ready for printing');
  };

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="pos-layout" style={{ marginTop: 0 }}>
      {/* ========== LEFT: Products ========== */}
      <div className="pos-left">
        {/* Top Bar */}
        <div className="pos-topbar">
          {/* Barcode input (hidden, for scanner focus) */}
          <input ref={barcodeRef} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />

          {/* Search */}
          <div className="pos-search">
            <div className="search-input-wrapper">
              <span className="search-icon"><Icons.Search /></span>
              <input ref={searchRef} className="form-control" placeholder="Search products or scan barcode..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && search.length > 3 && handleBarcodeSearch(search)} />
            </div>
          </div>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button onClick={() => setProductView('grid')}
              style={{ padding: '7px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                background: productView === 'grid' ? 'var(--orange)' : 'transparent',
                color: productView === 'grid' ? 'white' : 'var(--text-secondary)' }}>
              <Icons.Grid />
            </button>
            <button onClick={() => setProductView('list')}
              style={{ padding: '7px', border: 'none', borderRadius: '6px', cursor: 'pointer',
                background: productView === 'list' ? 'var(--orange)' : 'transparent',
                color: productView === 'list' ? 'white' : 'var(--text-secondary)' }}>
              <Icons.List />
            </button>
          </div>

          {/* Order Type */}
          <div className="order-type-tabs">
            {['DineIn', 'Takeaway', 'Delivery'].map(type => (
              <button key={type} className={`order-type-tab ${cart.orderType === type ? 'active' : ''}`}
                onClick={() => cart.setOrderType(type)}>
                {type === 'DineIn' ? '🪑' : type === 'Takeaway' ? '🥡' : '🛵'} {type}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <button className={`cat-chip ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory(null)}>
            🏪 All
          </button>
          {categories.map(cat => (
            <button key={cat.id} className={`cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={{ borderColor: selectedCategory === cat.id ? cat.color : undefined }}>
              {cat.icon ? <span>{cat.icon}</span> : null}
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        {productsLoading ? (
          <div className="page-loader"><div className="pos-spinner" /></div>
        ) : products.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '48px' }}>🔍</span>
            <div>No products found</div>
          </div>
        ) : productView === 'grid' ? (
          <div className="product-grid">
            {products.map(product => (
              <div key={product.id}
                className={`product-card ${product.currentStock <= 0 ? 'out-of-stock' : ''}`}
                onClick={() => product.currentStock > 0 && cart.addItem(product)}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="product-image" />
                ) : (
                  <div className="product-image-placeholder">
                    {product.category?.name === 'Beverages' ? '☕' : product.category?.name === 'Dairy' ? '🥛' : '🛒'}
                  </div>
                )}
                <div className="product-name">{product.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="product-price">{product.salePrice?.toFixed(2)}</span>
                  <span className="product-stock">{product.currentStock?.toFixed(0)} {product.unit?.abbreviation}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="product-list-view">
            {products.map(product => (
              <div key={product.id} className="product-row"
                onClick={() => product.currentStock > 0 && cart.addItem(product)}
                style={{ opacity: product.currentStock <= 0 ? 0.5 : 1, cursor: product.currentStock <= 0 ? 'not-allowed' : 'pointer' }}>
                <div className="product-row-img">
                  {product.imageUrl ? <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }} />
                    : <span>🛒</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Stock: {product.currentStock?.toFixed(0)} {product.unit?.abbreviation}</div>
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, color: 'var(--orange)', fontSize: '15px' }}>
                  {product.salePrice?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== RIGHT: Cart ========== */}
      <div className="pos-right">
        {/* Cart Header */}
        <div className="cart-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '16px' }}>Cart</span>
              {itemCount > 0 && (
                <span style={{ background: 'var(--orange)', color: 'white', borderRadius: '50%',
                  width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700 }}>{itemCount}</span>
              )}
            </div>
            {cart.items.length > 0 && (
              <button onClick={cart.clearCart} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '4px 8px' }}>
                Clear All
              </button>
            )}
          </div>

          {/* Customer & Table */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setShowCustomer(true)}
              style={{ flex: 1, padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500, transition: 'all 150ms' }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--orange)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}>
              <Icons.User />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {cart.customer ? cart.customer.name : 'Walk-in'}
              </span>
              {cart.customer && <button onClick={(e) => { e.stopPropagation(); cart.setCustomer(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', marginLeft: 'auto' }}>×</button>}
            </button>

            {cart.orderType === 'DineIn' && (
              <button onClick={() => setShowTable(true)}
                style={{ flex: 1, padding: '8px 10px', background: cart.table ? 'var(--orange-subtle)' : 'var(--bg-elevated)',
                  border: `1px solid ${cart.table ? 'var(--orange)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '12px',
                  color: cart.table ? 'var(--orange)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
                <Icons.Table />
                {cart.table ? cart.table.tableNumber : 'Table'}
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        {cart.items.length === 0 ? (
          <div className="cart-empty">
            <span style={{ fontSize: '48px' }}>🛒</span>
            <div style={{ fontWeight: 600 }}>Cart is empty</div>
            <div style={{ fontSize: '13px' }}>Click on products to add them</div>
          </div>
        ) : (
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.productId} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{item.unitPrice.toFixed(2)}</span>
                    {item.discountAmount > 0 && (
                      <span style={{ color: 'var(--success)', fontSize: '11px' }}>-{item.discountAmount.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                <div className="qty-control">
                  <button className="qty-btn" onClick={() => cart.updateQty(item.productId, item.quantity - 1)}>
                    <Icons.Minus />
                  </button>
                  <input className="qty-value" type="number" value={item.quantity}
                    onChange={(e) => cart.updateQty(item.productId, parseFloat(e.target.value) || 0)} />
                  <button className="qty-btn" onClick={() => cart.updateQty(item.productId, item.quantity + 1)}>
                    <Icons.Plus />
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span className="cart-item-total">
                    {((item.unitPrice * item.quantity) - item.discountAmount).toFixed(2)}
                  </span>
                  <button onClick={() => cart.removeItem(item.productId)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
                    <Icons.Trash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cart Footer */}
        <div className="cart-footer">
          {/* POS Action Buttons */}
          <div className="pos-action-btns">
            <button className="kot-btn kot" onClick={handleSendKOT} disabled={cart.items.length === 0}>
              <Icons.ChefHat /> KOT
            </button>
            <button className="kot-btn temp" onClick={handleTempBill} disabled={cart.items.length === 0}>
              <Icons.Printer /> Temp Bill
            </button>
            <button className="kot-btn hold" onClick={handleHoldCart} disabled={cart.items.length === 0}>
              <Icons.Pause /> Hold
            </button>
            <button className="kot-btn" onClick={() => setShowHeld(true)} style={{ borderColor: 'var(--info)', color: 'var(--info)', background: 'var(--info-bg)' }}>
              <Icons.Play /> Resume
            </button>
          </div>

          {/* Totals */}
          {cart.items.length > 0 && (
            <div className="cart-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>{cart.subTotal.toFixed(2)}</span>
              </div>
              {cart.taxAmount > 0 && (
                <div className="total-row">
                  <span>Tax</span>
                  <span>{cart.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {(cart.itemDiscounts + cart.orderDiscount) > 0 && (
                <div className="total-row" style={{ color: 'var(--success)' }}>
                  <span>Discount</span>
                  <span>-{(cart.itemDiscounts + cart.orderDiscount).toFixed(2)}</span>
                </div>
              )}

              {/* Discount button */}
              <button onClick={() => setShowDiscount(true)}
                className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '4px', marginBottom: '4px' }}>
                <Icons.Percent />
                {cart.discountType ? `Discount: ${cart.discountValue}${cart.discountType === 'Percent' ? '%' : ''}` : 'Add Discount'}
              </button>

              <div className="total-row grand">
                <span>TOTAL</span>
                <span className="amount">{cart.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Charge Button */}
          <div style={{ padding: '0 16px 16px' }}>
            <button className="charge-btn" onClick={() => setShowPayment(true)} disabled={cart.items.length === 0}>
              {!isOnline ? '📴 ' : ''}Charge {cart.total > 0 ? cart.total.toFixed(2) : ''}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Receipt */}
      {lastOrder && (
        <div style={{ display: 'none' }}>
          <div ref={receiptRef}>
            <ReceiptTemplate order={lastOrder} branch={{ name: 'SmartPOS', address: 'Main Branch', phone: '+92-000-0000000' }} />
          </div>
        </div>
      )}

      {/* Modals */}
      <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)}
        onComplete={(payments, change) => createOrderMutation.mutate({ payments, change })}
        total={cart.total} orderType={cart.orderType} />

      <CustomerModal isOpen={showCustomer} onClose={() => setShowCustomer(false)}
        onSelect={(customer) => { cart.setCustomer(customer); setShowCustomer(false); }} />

      <TableModal isOpen={showTable} onClose={() => setShowTable(false)}
        onSelect={(table) => { cart.setTable(table); setShowTable(false); }} />

      <HeldOrdersModal isOpen={showHeld} onClose={() => setShowHeld(false)}
        onResume={handleResumeOrder} />

      <DiscountModal isOpen={showDiscount} onClose={() => setShowDiscount(false)}
        onApply={cart.setDiscount}
        currentDiscount={{ type: cart.discountType, value: cart.discountValue }} />
    </div>
  );
}
