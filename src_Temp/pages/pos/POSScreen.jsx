import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCartStore } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const POSScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [orderType, setOrderType] = useState('Takeaway');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [discountModal, setDiscountModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);

  const cart = useCartStore();

  // Fetch products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products?pageSize=100');
      return res.data.data || [];
    },
  });

  // Fetch categories
  const { data: categoriesData = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data || [];
    },
  });

  // Fetch customers
  const { data: customersData = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await api.get('/customers?pageSize=100');
      return res.data.data || [];
    },
  });

  // Fetch tables
  const { data: tablesData = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const res = await api.get('/tables');
      return res.data.data || [];
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const res = await api.post('/orders', orderData);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Order created successfully!');
      cart.clear();
      setPaymentModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    },
  });

  // Filter products
  const filteredProducts = (productsData || []).filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch = !searchText || 
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchText));
    return matchesCategory && matchesSearch;
  });

  // Handle product click
  const handleProductClick = (product) => {
    cart.addItem({
      id: product.id,
      name: product.name,
      price: product.salePrice,
      quantity: 1,
      tax: product.taxRate,
    });
  };

  // Handle charge
  const handleCharge = () => {
    if (cart.items.length === 0) {
      toast.error('Cart is empty!');
      return;
    }
    setPaymentModal(true);
  };

  // Handle create order
  const handleCreateOrder = async (paymentMethods) => {
    const orderData = {
      customerId: selectedCustomer?.id || null,
      tableId: selectedTable?.id || null,
      orderType,
      items: cart.items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
        discountAmount: item.discount || 0,
        notes: item.notes || '',
      })),
      discountType: cart.discountType,
      discountValue: cart.discountValue,
      payments: paymentMethods,
    };

    createOrderMutation.mutate(orderData);
  };

  if (productsLoading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pos-layout">
      {/* PRODUCTS SECTION */}
      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{
          background: 'white',
          padding: '12px',
          borderBottom: '1px solid #E0E0E0',
          display: 'flex',
          gap: '8px',
          flexShrink: 0,
        }}>
          {/* Order Type Tabs */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Takeaway', 'Dine-in'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: orderType === type ? '#FF6B35' : '#F8F9FA',
                  color: orderType === type ? 'white' : '#666',
                  transition: 'all 150ms',
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                border: '1px solid #E0E0E0',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
              }}
            />
            <span style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
              fontSize: '14px',
            }}>
              🔍
            </span>
          </div>
        </div>

        {/* Categories */}
        <div style={{
          display: 'flex',
          gap: '6px',
          padding: '8px 12px',
          overflowX: 'auto',
          borderBottom: '1px solid #E0E0E0',
          flexShrink: 0,
          scrollBehavior: 'smooth',
        }}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: selectedCategory === null ? 'none' : '1px solid #E0E0E0',
              background: selectedCategory === null ? '#FF6B35' : 'white',
              color: selectedCategory === null ? 'white' : '#666',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            All
          </button>
          {categoriesData.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: selectedCategory === cat.id ? 'none' : '1px solid #E0E0E0',
                background: selectedCategory === cat.id ? '#FF6B35' : 'white',
                color: selectedCategory === cat.id ? 'white' : '#666',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="pos-products">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => handleProductClick(product)}
            >
              <div className="product-image">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '🍕'
                )}
              </div>
              <div className="product-name">{product.name}</div>
              <div className="product-price">Rs {product.salePrice.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CART PANEL */}
      <div className="cart-panel">
        <div className="cart-header">
          <span>Cart ({cart.items.length})</span>
          {cart.items.length > 0 && (
            <button
              onClick={() => cart.clear()}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        <div className="cart-items">
          {cart.items.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#999',
              fontSize: '13px',
            }}>
              Add items to cart
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">Rs {item.price.toLocaleString()}</div>
                </div>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <div className="qty-val">{item.quantity}</div>
                  <button
                    className="qty-btn"
                    onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-total">Rs {(item.price * item.quantity).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        <div className="cart-footer">
          {/* Totals */}
          <div style={{
            padding: '10px',
            background: '#F8F9FA',
            borderRadius: '8px',
            fontSize: '13px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Subtotal:</span>
              <span>Rs {cart.subTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#666' }}>
              <span>Tax:</span>
              <span>Rs {cart.tax.toLocaleString()}</span>
            </div>
            {cart.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#10B981' }}>
                <span>Discount:</span>
                <span>-Rs {cart.discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: '700',
              color: '#FF6B35',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #E0E0E0',
            }}>
              <span>Total:</span>
              <span>Rs {cart.total.toLocaleString()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => setDiscountModal(true)}
              className="btn btn-secondary btn-sm"
            >
              💰 Discount
            </button>
            <button
              onClick={() => toast.info('Hold feature coming soon')}
              className="btn btn-secondary btn-sm"
            >
              ⏸ Hold
            </button>
          </div>

          {/* Charge Button */}
          <button
            onClick={handleCharge}
            disabled={cart.items.length === 0}
            className="btn btn-primary btn-lg btn-block"
            style={{
              opacity: cart.items.length === 0 ? 0.5 : 1,
              cursor: cart.items.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            💳 Charge
          </button>
        </div>
      </div>

      {/* DISCOUNT MODAL */}
      {discountModal && (
        <div className="modal-overlay" onClick={() => setDiscountModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Apply Discount</h2>
              <button className="modal-close" onClick={() => setDiscountModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => cart.setDiscountType('Fixed')}
                    className={`btn btn-sm ${cart.discountType === 'Fixed' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    Fixed Amount
                  </button>
                  <button
                    onClick={() => cart.setDiscountType('Percent')}
                    className={`btn btn-sm ${cart.discountType === 'Percent' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1 }}
                  >
                    Percentage
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {cart.discountType === 'Fixed' ? 'Amount (Rs)' : 'Percentage (%)'}
                </label>
                <input
                  type="number"
                  value={cart.discountValue}
                  onChange={(e) => cart.setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="form-control"
                  placeholder="Enter amount"
                />
              </div>

              <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>
                Discount Amount: <strong>Rs {cart.discount.toLocaleString()}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDiscountModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => setDiscountModal(false)} className="btn btn-primary">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {paymentModal && (
        <div className="modal-overlay" onClick={() => setPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Payment</h2>
              <button className="modal-close" onClick={() => setPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <PaymentForm
                total={cart.total}
                onSubmit={handleCreateOrder}
                isLoading={createOrderMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Payment Form Component
const PaymentForm = ({ total, onSubmit, isLoading }) => {
  const [payments, setPayments] = useState([{ method: 'Cash', amount: total }]);

  const handleAddPayment = () => {
    setPayments([...payments, { method: 'Cash', amount: 0 }]);
  };

  const handlePaymentChange = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;
    setPayments(newPayments);
  };

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = Math.max(0, total - totalPaid);

  const handleSubmit = () => {
    if (totalPaid < total) {
      toast.error('Payment is incomplete!');
      return;
    }
    onSubmit(payments.filter(p => p.amount > 0));
  };

  return (
    <div>
      <div style={{
        background: '#F8F9FA',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
          <span>Total Amount:</span>
          <span style={{ fontWeight: '700', color: '#FF6B35' }}>Rs {total.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: remaining > 0 ? '#EF4444' : '#10B981' }}>
          <span>Remaining:</span>
          <span style={{ fontWeight: '700' }}>Rs {remaining.toLocaleString()}</span>
        </div>
      </div>

      {payments.map((payment, index) => (
        <div key={index} style={{ marginBottom: '12px' }} className="form-group">
          <label className="form-label">Payment Method {index + 1}</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={payment.method}
              onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
              className="form-control"
              style={{ flex: 1 }}
            >
              <option>Cash</option>
              <option>Card</option>
              <option>Mobile Wallet</option>
              <option>Bank Transfer</option>
            </select>
            <input
              type="number"
              value={payment.amount}
              onChange={(e) => handlePaymentChange(index, 'amount', parseFloat(e.target.value) || 0)}
              className="form-control"
              placeholder="Amount"
              style={{ width: '120px' }}
            />
            {payments.length > 1 && (
              <button
                onClick={() => setPayments(payments.filter((_, i) => i !== index))}
                className="btn btn-danger btn-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddPayment}
        className="btn btn-secondary btn-sm btn-block"
        style={{ marginBottom: '12px' }}
      >
        + Add Payment Method
      </button>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-secondary"
          style={{ flex: 1 }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading || remaining > 0}
          className="btn btn-success"
          style={{ flex: 1, opacity: remaining > 0 ? 0.5 : 1 }}
        >
          {isLoading ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </div>
  );
};

export default POSScreen;
