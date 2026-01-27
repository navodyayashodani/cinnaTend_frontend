// src/components/RegisterModal.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth

const initialFormState = {
  username: '',
  email: '',
  password: '',
  password2: '',
  first_name: '',
  last_name: '',
  role: 'buyer',
  phone_number: '',
  company_name: '',
};

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ Get login function from context

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ RESET FORM WHEN MODAL OPENS
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors({});
    } else {
      // Also reset when modal closes
      setFormData(initialFormState);
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear field error when user edits
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      console.log('Attempting registration...');
      console.log('Form data:', formData);
      
      const response = await authAPI.register(formData);
      
      console.log('Registration response:', response.data);

      // ✅ Save tokens
      setAuthToken(response.data.access, response.data.refresh);
      
      // ✅ THIS IS THE KEY - Update global auth state using context
      login(response.data.user);
      
      console.log('User registered and context updated:', response.data.user);

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
      console.error('Registration error:', err);
      console.error('Error response:', err.response?.data);
      
      /**
       * Django DRF returns field-level errors like:
       * {
       *   "username": ["Username must be at least 3 characters long."],
       *   "password2": ["Passwords do not match."]
       * }
       */
      if (err.response?.data && typeof err.response.data === 'object') {
        setErrors(err.response.data);
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    onClose();
    if (onSwitchToLogin) onSwitchToLogin();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Create Account</h2>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {errors.general && (
            <div style={styles.errorAlert}>⚠️ {errors.general}</div>
          )}

          {/* First & Last Name */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name *</label>
              <input 
                name="first_name" 
                value={formData.first_name} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="given-name"
              />
              {errors.first_name && <p style={styles.fieldError}>{errors.first_name[0]}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name *</label>
              <input 
                name="last_name" 
                value={formData.last_name} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="family-name"
              />
              {errors.last_name && <p style={styles.fieldError}>{errors.last_name[0]}</p>}
            </div>
          </div>

          {/* Username & Email */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username *</label>
              <input 
                name="username" 
                value={formData.username} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="username"
              />
              {errors.username && <p style={styles.fieldError}>{errors.username[0]}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="email"
              />
              {errors.email && <p style={styles.fieldError}>{errors.email[0]}</p>}
            </div>
          </div>

          {/* Passwords */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Password *</label>
              <input 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="new-password"
              />
              {errors.password && <p style={styles.fieldError}>{errors.password[0]}</p>}
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Confirm Password *</label>
              <input 
                type="password" 
                name="password2" 
                value={formData.password2} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="new-password"
              />
              {errors.password2 && <p style={styles.fieldError}>{errors.password2[0]}</p>}
            </div>
          </div>

          {/* Role & Company */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>I am a *</label>
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange} 
                style={styles.select}
              >
                <option value="buyer">Buyer</option>
                <option value="manufacturer">Manufacturer</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Company Name</label>
              <input 
                name="company_name" 
                value={formData.company_name} 
                onChange={handleChange} 
                style={styles.input}
                autoComplete="organization"
              />
            </div>
          </div>

          {/* Phone */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Phone Number</label>
            <input 
              name="phone_number" 
              value={formData.phone_number} 
              onChange={handleChange} 
              style={styles.input}
              placeholder="e.g., +1234567890"
              autoComplete="tel"
            />
            {errors.phone_number && <p style={styles.fieldError}>{errors.phone_number[0]}</p>}
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {})
            }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div style={styles.footer}>
            Already have an account?
            <button type="button" onClick={handleSwitchToLogin} style={styles.linkBtn}>
              Login here
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
    inset: 0, 
    background: 'rgba(0,0,0,0.6)', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: { 
    background: '#fff', 
    borderRadius: 12, 
    width: '90%', 
    maxWidth: 520,
    maxHeight: '90vh',
    overflow: 'auto',
  },
  header: { 
    padding: '1.5rem', 
    borderBottom: '1px solid #ddd', 
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  form: { 
    padding: '1.5rem',
  },
  row: { 
    display: 'flex', 
    gap: '1rem',
  },
  formGroup: { 
    flex: 1, 
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    color: '#2c3e50',
    fontWeight: '500',
    fontSize: '0.9rem',
  },
  input: { 
    width: '100%', 
    padding: '0.75rem', 
    border: '2px solid #e0e0e0', 
    borderRadius: 8,
    fontSize: '1rem',
    boxSizing: 'border-box',
    transition: 'all 0.3s',
  },
  select: { 
    width: '100%', 
    padding: '0.75rem', 
    border: '2px solid #e0e0e0', 
    borderRadius: 8,
    fontSize: '1rem',
    boxSizing: 'border-box',
    cursor: 'pointer',
  },
  submitBtn: { 
    width: '100%', 
    padding: '0.875rem', 
    background: '#27ae60', 
    color: '#fff', 
    border: 'none', 
    borderRadius: 8,
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  submitBtnDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed',
  },
  errorAlert: { 
    background: '#fee', 
    color: '#c0392b', 
    padding: '0.75rem', 
    borderRadius: 8, 
    marginBottom: '1rem',
    border: '1px solid #fcc',
  },
  fieldError: { 
    color: '#c0392b', 
    fontSize: '0.8rem', 
    marginTop: '0.25rem',
    margin: '0.25rem 0 0 0',
  },
  footer: { 
    textAlign: 'center', 
    marginTop: '1rem',
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
    textDecoration: 'underline',
  },
};

export default RegisterModal;