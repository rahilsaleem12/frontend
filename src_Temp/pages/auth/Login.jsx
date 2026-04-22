import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../services/api';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const res = await api.post('/auth/login', credentials);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user);
      toast.success('Login successful!');
      navigate('/pos');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter username and password');
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const handleDemoLogin = (user) => {
    setUsername(user.username);
    setPassword(user.password);
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF6B35 0%, #E55A20 100%)',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '16px',
        padding: '32px 24px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      }}>
        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: '#FF6B35',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: '900',
            color: 'white',
            margin: '0 auto 16px',
          }}>
            S
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            margin: '0 0 8px',
            color: '#1A1A1A',
          }}>
            SmartPOS
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#999',
            margin: 0,
          }}>
            Professional Billing System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ marginBottom: '24px' }}>
          {/* Username */}
          <div className="form-group">
            <label className="form-label">Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="form-control"
                disabled={loginMutation.isPending}
              />
              <span style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#FF6B35',
                fontSize: '18px',
              }}>
                👤
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-control"
                disabled={loginMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  color: '#FF6B35',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn btn-primary btn-lg btn-block"
            style={{
              marginTop: '16px',
              opacity: loginMutation.isPending ? 0.7 : 1,
            }}
          >
            {loginMutation.isPending ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                Logging in...
              </span>
            ) : (
              '🔓 Login'
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '24px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: '#E0E0E0' }}></div>
          <span style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>DEMO USERS</span>
          <div style={{ flex: 1, height: '1px', background: '#E0E0E0' }}></div>
        </div>

        {/* Demo Users */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { name: 'Admin', username: 'admin', password: 'Admin@123', icon: '👑' },
            { name: 'Cashier', username: 'cashier', password: 'Cash@123', icon: '💰' },
          ].map((user) => (
            <button
              key={user.username}
              type="button"
              onClick={() => handleDemoLogin(user)}
              style={{
                padding: '12px',
                background: '#F8F9FA',
                border: '1px solid #E0E0E0',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#1A1A1A',
                transition: 'all 150ms',
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#FFE5D9';
                e.target.style.borderColor = '#FF6B35';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#F8F9FA';
                e.target.style.borderColor = '#E0E0E0';
              }}
            >
              <span style={{ fontSize: '16px' }}>{user.icon}</span>
              <span>{user.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#999' }}>
                Tap to fill
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#F8F9FA',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center',
          lineHeight: '1.6',
        }}>
          <strong>Demo Credentials:</strong>
          <br />
          Admin: admin / Admin@123
          <br />
          Cashier: cashier / Cash@123
        </div>
      </div>
    </div>
  );
};

export default Login;
