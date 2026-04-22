// =============================================
// API Service - Axios with interceptors
// =============================================
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'https://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('pos_refresh_token');
        const response = await axios.post(`${API_BASE}/auth/refresh`, JSON.stringify(refreshToken), {
          headers: { 'Content-Type': 'application/json' }
        });
        const { accessToken, refreshToken: newRefresh } = response.data.data;
        localStorage.setItem('pos_access_token', accessToken);
        localStorage.setItem('pos_refresh_token', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// =============================================
// Zustand Store - Global State
// =============================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Auth Store
export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, accessToken, refreshToken) => {
        localStorage.setItem('pos_access_token', accessToken);
        localStorage.setItem('pos_refresh_token', refreshToken);
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('pos_access_token');
        localStorage.removeItem('pos_refresh_token');
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (user) => set({ user })
    }),
    { name: 'pos-auth', storage: createJSONStorage(() => localStorage) }
  )
);

// POS Cart Store
export const useCartStore = create((set, get) => ({
  items: [],
  customer: null,
  table: null,
  orderType: 'Takeaway',
  discountType: null,
  discountValue: 0,
  notes: '',
  payments: [],

  // Add item to cart
  addItem: (product, qty = 1) => {
    const items = get().items;
    const existing = items.find(i => i.productId === product.id);
    if (existing) {
      set({ items: items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i) });
    } else {
      set({
        items: [...items, {
          productId: product.id,
          name: product.name,
          unitPrice: product.salePrice,
          quantity: qty,
          taxRate: product.taxRate || 0,
          discountAmount: 0,
          notes: '',
          imageUrl: product.imageUrl,
          unit: product.unit?.abbreviation
        }]
      });
    }
  },

  // Update item quantity
  updateQty: (productId, qty) => {
    if (qty <= 0) {
      set({ items: get().items.filter(i => i.productId !== productId) });
    } else {
      set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity: qty } : i) });
    }
  },

  // Update item price
  updatePrice: (productId, price) => {
    set({ items: get().items.map(i => i.productId === productId ? { ...i, unitPrice: price } : i) });
  },

  // Update item discount
  updateItemDiscount: (productId, discount) => {
    set({ items: get().items.map(i => i.productId === productId ? { ...i, discountAmount: discount } : i) });
  },

  // Remove item
  removeItem: (productId) => {
    set({ items: get().items.filter(i => i.productId !== productId) });
  },

  // Set customer
  setCustomer: (customer) => set({ customer }),

  // Set table
  setTable: (table) => set({ table }),

  // Set order type
  setOrderType: (type) => set({ orderType: type }),

  // Set discount
  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),

  // Set notes
  setNotes: (notes) => set({ notes }),

  // Add payment
  addPayment: (payment) => set({ payments: [...get().payments, payment] }),
  
  // Remove payment
  removePayment: (index) => set({ payments: get().payments.filter((_, i) => i !== index) }),

  // Clear cart
  clearCart: () => set({
    items: [], customer: null, table: null,
    discountType: null, discountValue: 0, notes: '',
    payments: [], orderType: 'Takeaway'
  }),

  // Computed values
  get subTotal() {
    return get().items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  },
  get taxAmount() {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.unitPrice * item.quantity - item.discountAmount;
      return sum + (lineTotal * (item.taxRate / 100));
    }, 0);
  },
  get itemDiscounts() {
    return get().items.reduce((sum, item) => sum + item.discountAmount, 0);
  },
  get orderDiscount() {
    const { discountType, discountValue } = get();
    const sub = get().items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
    if (!discountType) return 0;
    return discountType === 'Percent' ? sub * (discountValue / 100) : discountValue;
  },
  get total() {
    const sub = get().items.reduce((s, i) => s + (i.unitPrice * i.quantity), 0);
    const tax = get().taxAmount;
    const itemDisc = get().itemDiscounts;
    const orderDisc = get().orderDiscount;
    return Math.max(0, sub + tax - itemDisc - orderDisc);
  },
  get totalPaid() {
    return get().payments.reduce((s, p) => s + p.amount, 0);
  },
  get balance() {
    return get().total - get().totalPaid;
  }
}));

// App Settings Store
export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      currency: 'PKR',
      taxEnabled: true,
      defaultTax: 0,
      receiptPrinter: 'thermal',
      productView: 'grid',  // grid | list
      autoKOT: false,
      branch: null,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setProductView: (view) => set({ productView: view }),
      setBranch: (branch) => set({ branch })
    }),
    { name: 'pos-settings' }
  )
);

// Online Status Store
export const useOnlineStore = create((set) => ({
  isOnline: navigator.onLine,
  pendingCount: 0,
  setOnline: (status) => set({ isOnline: status }),
  setPendingCount: (count) => set({ pendingCount: count })
}));
