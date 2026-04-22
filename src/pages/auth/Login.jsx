// =============================================
// Login.jsx
// =============================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { useAuthStore } from '../../services/api';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data.data;
      login(user, accessToken, refreshToken);
      toast.success(`Welcome, ${user.fullName}!`);
      navigate('/dashboard');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return toast.error('Please fill all fields');
    mutation.mutate(form);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '20px',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(255,107,53,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(255,107,53,0.05) 0%, transparent 50%)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px', height: '72px', background: 'linear-gradient(135deg, var(--orange), var(--orange-dark))',
            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: 'var(--shadow-orange)',
            fontFamily: 'Syne', fontWeight: 900, fontSize: '32px', color: 'white'
          }}>S</div>
          <h1 style={{ fontFamily: 'Syne', fontSize: '32px', fontWeight: 800, marginBottom: '6px' }}>
            Smart<span style={{ color: 'var(--orange)' }}>POS</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Sign in to your Point of Sale system
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Username</label>
              <input className="form-control" placeholder="Enter your username" value={form.username}
                onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                autoComplete="username" autoFocus style={{ padding: '13px 16px', fontSize: '15px' }} />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-control" type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password" value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                  autoComplete="current-password" style={{ padding: '13px 48px 13px 16px', fontSize: '15px' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '18px' }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="pos-spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                  Signing in...
                </span>
              ) : '🔐 Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div style={{
            marginTop: '24px', padding: '14px', background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Demo Credentials
            </div>
            {[
              { role: 'Admin', user: 'admin', pass: 'Admin@123' },
              { role: 'Cashier', user: 'cashier', pass: 'Cash@123' },
            ].map(c => (
              <div key={c.role} onClick={() => setForm({ username: c.user, password: c.pass })}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0',
                  cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                <span style={{ color: 'var(--orange)', fontWeight: 600 }}>{c.role}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.user} / {c.pass}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
          SmartPOS v1.0 • Powered by Anthropic AI
        </p>
      </div>
    </div>
  );
}
