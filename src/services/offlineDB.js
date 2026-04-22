// =============================================
// Offline Database - IndexedDB via idb
// =============================================
import { openDB } from 'idb';

const DB_NAME = 'SmartPOS';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Products store
      if (!db.objectStoreNames.contains('products')) {
        const products = db.createObjectStore('products', { keyPath: 'id' });
        products.createIndex('barcode', 'barcode');
        products.createIndex('categoryId', 'categoryId');
      }
      // Categories
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      // Customers
      if (!db.objectStoreNames.contains('customers')) {
        const customers = db.createObjectStore('customers', { keyPath: 'id' });
        customers.createIndex('phone', 'phone');
      }
      // Tables
      if (!db.objectStoreNames.contains('tables')) {
        db.createObjectStore('tables', { keyPath: 'id' });
      }
      // Pending Orders (offline)
      if (!db.objectStoreNames.contains('pendingOrders')) {
        const po = db.createObjectStore('pendingOrders', { keyPath: 'localId', autoIncrement: true });
        po.createIndex('createdAt', 'createdAt');
      }
      // Held Orders
      if (!db.objectStoreNames.contains('heldOrders')) {
        db.createObjectStore('heldOrders', { keyPath: 'id', autoIncrement: true });
      }
      // Sync queue
      if (!db.objectStoreNames.contains('syncQueue')) {
        const sq = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        sq.createIndex('status', 'status');
      }
      // Settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      // Orders cache
      if (!db.objectStoreNames.contains('orders')) {
        const orders = db.createObjectStore('orders', { keyPath: 'id' });
        orders.createIndex('createdAt', 'createdAt');
        orders.createIndex('status', 'status');
      }
    }
  });
};

// =============================================
// Offline DB Helper Functions
// =============================================
let dbPromise = null;
const getDB = () => {
  if (!dbPromise) dbPromise = initDB();
  return dbPromise;
};

export const offlineDB = {
  // Products
  async saveProducts(products) {
    const db = await getDB();
    const tx = db.transaction('products', 'readwrite');
    await Promise.all(products.map(p => tx.store.put(p)));
    await tx.done;
  },
  async getProducts() {
    const db = await getDB();
    return db.getAll('products');
  },
  async getProductByBarcode(barcode) {
    const db = await getDB();
    return db.getFromIndex('products', 'barcode', barcode);
  },

  // Categories
  async saveCategories(categories) {
    const db = await getDB();
    const tx = db.transaction('categories', 'readwrite');
    await Promise.all(categories.map(c => tx.store.put(c)));
    await tx.done;
  },
  async getCategories() {
    const db = await getDB();
    return db.getAll('categories');
  },

  // Customers
  async saveCustomers(customers) {
    const db = await getDB();
    const tx = db.transaction('customers', 'readwrite');
    await Promise.all(customers.map(c => tx.store.put(c)));
    await tx.done;
  },
  async getCustomers() {
    const db = await getDB();
    return db.getAll('customers');
  },
  async searchCustomers(query) {
    const all = await this.getCustomers();
    const q = query.toLowerCase();
    return all.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q));
  },

  // Tables
  async saveTables(tables) {
    const db = await getDB();
    const tx = db.transaction('tables', 'readwrite');
    await Promise.all(tables.map(t => tx.store.put(t)));
    await tx.done;
  },
  async getTables() {
    const db = await getDB();
    return db.getAll('tables');
  },

  // Pending Orders (offline created)
  async savePendingOrder(order) {
    const db = await getDB();
    const id = await db.add('pendingOrders', { ...order, createdAt: new Date().toISOString(), syncStatus: 'pending' });
    return id;
  },
  async getPendingOrders() {
    const db = await getDB();
    return db.getAll('pendingOrders');
  },
  async deletePendingOrder(localId) {
    const db = await getDB();
    await db.delete('pendingOrders', localId);
  },

  // Held Orders
  async saveHeldOrder(order) {
    const db = await getDB();
    return db.add('heldOrders', { ...order, heldAt: new Date().toISOString() });
  },
  async getHeldOrders() {
    const db = await getDB();
    return db.getAll('heldOrders');
  },
  async deleteHeldOrder(id) {
    const db = await getDB();
    await db.delete('heldOrders', id);
  },

  // Sync Queue
  async addToSyncQueue(item) {
    const db = await getDB();
    return db.add('syncQueue', { ...item, createdAt: new Date().toISOString(), status: 'pending', attempts: 0 });
  },
  async getPendingSyncItems() {
    const db = await getDB();
    return db.getAllFromIndex('syncQueue', 'status', 'pending');
  },
  async markSyncItem(id, status) {
    const db = await getDB();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.status = status;
      item.attempts = (item.attempts || 0) + 1;
      await db.put('syncQueue', item);
    }
  },
  async clearSyncedItems() {
    const db = await getDB();
    const all = await db.getAll('syncQueue');
    const tx = db.transaction('syncQueue', 'readwrite');
    await Promise.all(all.filter(i => i.status === 'synced').map(i => tx.store.delete(i.id)));
    await tx.done;
  },

  // Settings
  async setSetting(key, value) {
    const db = await getDB();
    await db.put('settings', { key, value });
  },
  async getSetting(key) {
    const db = await getDB();
    const item = await db.get('settings', key);
    return item?.value;
  },

  // Last sync timestamp
  async setLastSync(timestamp) {
    await this.setSetting('lastSync', timestamp);
  },
  async getLastSync() {
    return this.getSetting('lastSync');
  }
};

// =============================================
// Online/Offline Sync Manager
// =============================================
export class SyncManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.isSyncing = false;
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('online', () => this.syncWhenOnline());
    
    // Listen for service worker sync complete
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          this.pullFromServer();
        }
      });
    }
  }

  async syncWhenOnline() {
    if (!navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;
    
    try {
      await this.pushPendingOrders();
      await this.pushSyncQueue();
      await this.pullFromServer();
    } finally {
      this.isSyncing = false;
    }
  }

  async pushPendingOrders() {
    const pending = await offlineDB.getPendingOrders();
    for (const order of pending) {
      try {
        await this.api.post('/orders', order);
        await offlineDB.deletePendingOrder(order.localId);
      } catch (err) {
        console.error('Failed to sync order:', err);
      }
    }
  }

  async pushSyncQueue() {
    const items = await offlineDB.getPendingSyncItems();
    if (items.length === 0) return;
    
    try {
      await this.api.post('/sync/push', items);
      for (const item of items) {
        await offlineDB.markSyncItem(item.id, 'synced');
      }
      await offlineDB.clearSyncedItems();
    } catch (err) {
      console.error('Sync push failed:', err);
    }
  }

  async pullFromServer() {
    try {
      const lastSync = await offlineDB.getLastSync() || new Date(0).toISOString();
      const response = await this.api.get(`/sync/pull?lastSyncAt=${lastSync}`);
      const changes = response.data.data;

      if (changes.products?.length) await offlineDB.saveProducts(changes.products);
      if (changes.categories?.length) await offlineDB.saveCategories(changes.categories);
      if (changes.customers?.length) await offlineDB.saveCustomers(changes.customers);
      if (changes.tables?.length) await offlineDB.saveTables(changes.tables);

      await offlineDB.setLastSync(new Date().toISOString());
    } catch (err) {
      console.error('Sync pull failed:', err);
    }
  }

  async initialSync() {
    if (!navigator.onLine) return;
    
    try {
      const [products, categories, customers, tables] = await Promise.all([
        this.api.get('/products?pageSize=1000'),
        this.api.get('/categories'),
        this.api.get('/customers?pageSize=2000'),
        this.api.get('/tables')
      ]);

      await offlineDB.saveProducts(products.data.data);
      await offlineDB.saveCategories(categories.data.data);
      await offlineDB.saveCustomers(customers.data.data);
      await offlineDB.saveTables(tables.data.data);
      await offlineDB.setLastSync(new Date().toISOString());
    } catch (err) {
      console.error('Initial sync failed:', err);
    }
  }
}
