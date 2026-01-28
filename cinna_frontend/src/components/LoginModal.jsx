// src/components/LoginModal.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Get login function from context
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setFormData({ username: '', password: '' });
      setErrors({});
      setServerError('');
    } else {
      // Also reset when modal closes
      setFormData({ username: '', password: '' });
      setErrors({});
      setServerError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
    setServerError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length) {
      setErrors(formErrors);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      console.log('Attempting login...');
      const response = await authAPI.login({
        username: formData.username,
        password: formData.password,
      });
      
      console.log('Login response:', response.data);
      
      // ✅ Save tokens
      setAuthToken(response.data.access, response.data.refresh);
      
      // ✅ THIS IS THE KEY - Update global auth state using context
      login(response.data.user);
      
      console.log('User logged in and context updated:', response.data.user);
      
      // ✅ Close modal first
      onClose();
      
      // Navigate to appropriate dashboard
      const dashboardPath = response.data.user.role === 'manufacturer'
        ? '/manufacturer-dashboard'
        : '/buyer-dashboard';
      
      console.log('Navigating to:', dashboardPath);
      
      // ✅ Small delay to ensure state updates propagate
      setTimeout(() => {
        navigate(dashboardPath);
      }, 100);
      
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      setServerError(
        err.response?.data?.error || 
        err.response?.data?.detail ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToRegister = () => {
    onClose();
    if (onSwitchToRegister) {
      onSwitchToRegister();
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome Back</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {serverError && (
            <div style={styles.errorAlert}>
              <span style={styles.errorIcon}>⚠️</span>
              {serverError}
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>👤</span>
              <input
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                style={{
                  ...styles.input,
                  ...(errors.username ? styles.inputError : {})
                }}
              />
            </div>
            {errors.username && (
              <span style={styles.errorText}>{errors.username}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <span style={styles.inputIcon}>🔒</span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{
                  ...styles.input,
                  ...(errors.password ? styles.inputError : {})
                }}
              />
            </div>
            {errors.password && (
              <span style={styles.errorText}>{errors.password}</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {})
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div style={styles.footer}>
            Don't have an account? 
            <button 
              type="button" 
              onClick={handleSwitchToRegister} 
              style={styles.linkBtn}
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#f8f9fa',
  },
  title: {
    margin: 0,
    color: '#2c3e50',
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    cursor: 'pointer',
    color: '#7f8c8d',
    lineHeight: 1,
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },
  form: {
    padding: '2rem',
  },
  formGroup: {
    marginBottom: '1.25rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '1rem',
    fontSize: '1.2rem',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.3s',
    outline: 'none',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  errorText: {
    display: 'block',
    color: '#e74c3c',
    fontSize: '0.85rem',
    marginTop: '0.25rem',
  },
  submitBtn: {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '1rem',
  },
  submitBtnDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  errorAlert: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '0.875rem',
    borderRadius: '8px',
    marginBottom: '1.25rem',
    border: '1px solid #fcc',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  errorIcon: {
    fontSize: '1.2rem',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    color: '#7f8c8d',
    fontSize: '0.9rem',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#3498db',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '500',
    marginLeft: '0.25rem',
    padding: '0.25rem',
    textDecoration: 'underline',
  },
};

export default LoginModal;