// =============================================
// Products.jsx — Full CRUD with modal form
// =============================================
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EMPTY = {
  categoryId: '', unitId: '', name: '', description: '', barcode: '',
  sku: '', purchasePrice: '', salePrice: '', taxRate: 0,
  minimumStock: 5, maximumStock: 1000, isFeatured: false, imageUrl: ''
};

function ProductModal({ open, onClose, initial, categories, units }) {
  const [form, setForm] = useState(initial || EMPTY);
  const qc = useQueryClient();

  React.useEffect(() => { setForm(initial || EMPTY); }, [initial]);

  const isEdit = !!initial?.id;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/products/${initial.id}`, data)
      : api.post('/products', data),
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      qc.invalidateQueries(['products']);
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error saving product')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.salePrice || !form.categoryId || !form.unitId)
      return toast.error('Fill required fields');
    mutation.mutate({ ...form, salePrice: +form.salePrice, purchasePrice: +form.purchasePrice, taxRate: +form.taxRate, minimumStock: +form.minimumStock });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <span className="modal-title">{isEdit ? '✏️ Edit' : '➕ Add'} Product</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Product Name *</label>
                <input className="form-control" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Milk 1 Liter" required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-control" value={form.categoryId} onChange={(e) => set('categoryId', +e.target.value)} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Unit *</label>
                <select className="form-control" value={form.unitId} onChange={(e) => set('unitId', +e.target.value)} required>
                  <option value="">Select unit</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price</label>
                <input className="form-control" type="number" step="0.01" min="0" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Sale Price *</label>
                <input className="form-control" type="number" step="0.01" min="0" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label className="form-label">Tax Rate (%)</label>
                <input className="form-control" type="number" step="0.01" min="0" max="100" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Barcode</label>
                <input className="form-control" value={form.barcode} onChange={(e) => set('barcode', e.target.value)} placeholder="Scan or type barcode" />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input className="form-control" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="Stock Keeping Unit" />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Stock Alert</label>
                <input className="form-control" type="number" min="0" value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input className="form-control" value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Optional description" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" id="featured" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--orange)' }} />
                <label htmlFor="featured" style={{ cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>Featured Product</label>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState({ open: false, data: null });

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/categories').then(r => r.data.data) });
  const { data: units } = useQuery({ queryKey: ['units'], queryFn: () => api.get('/units').then(r => r.data.data) });

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, catFilter, page],
    queryFn: async () => {
      const p = new URLSearchParams({ page, pageSize: 30 });
      if (search) p.append('search', search);
      if (catFilter) p.append('categoryId', catFilter);
      const r = await api.get(`/products?${p}`);
      return r.data;
    },
    keepPreviousData: true
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => { toast.success('Product deleted'); qc.invalidateQueries(['products']); }
  });

  const products = data?.data || [];
  const total = data?.totalCount || 0;
  const totalPages = Math.ceil(total / 30);

  const stockBadge = (p) => {
    if (p.currentStock <= 0) return <span className="badge badge-danger">Out of Stock</span>;
    if (p.currentStock <= p.minimumStock) return <span className="badge badge-warning">Low Stock</span>;
    return <span className="badge badge-success">In Stock</span>;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ marginBottom: '4px' }}>Products</h2>
          <p style={{ fontSize: '14px' }}>{total} products total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ open: true, data: null })}>
          ＋ Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
            <span className="search-icon">🔍</span>
            <input className="form-control" placeholder="Search by name, barcode, SKU..."
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control" style={{ width: '180px' }} value={catFilter}
            onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {(cats || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="page-loader"><div className="pos-spinner" /></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No products found</td></tr>
                ) : products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                          {p.imageUrl ? <img src={p.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📦</span>}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                          {p.barcode && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>📊 {p.barcode}</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-muted">{p.category?.name}</span></td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--orange)' }}>₨ {p.salePrice?.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Cost: {p.purchasePrice?.toFixed(2)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.currentStock?.toFixed(2)} {p.unit?.abbreviation}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Min: {p.minimumStock}</div>
                    </td>
                    <td>{stockBadge(p)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setModal({ open: true, data: p })}>Edit</button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => window.confirm(`Delete "${p.name}"?`) && deleteMutation.mutate(p.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>◀ Prev</button>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next ▶</button>
          </div>
        )}
      </div>

      <ProductModal open={modal.open} onClose={() => setModal({ open: false, data: null })}
        initial={modal.data} categories={cats || []} units={units || []} />
    </div>
  );
}
