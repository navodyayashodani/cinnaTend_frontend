// src/components/RegisterModal.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, setAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  const { login } = useAuth();

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ RESET FORM WHEN MODAL OPENS
  useEffect(() => {
    if (isOpen) {
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
      const response = await authAPI.register(formData);

      setAuthToken(response.data.access, response.data.refresh);
      login(response.data.user);

      navigate(
        response.data.user.role === 'manufacturer'
          ? '/manufacturer-dashboard'
          : '/buyer-dashboard'
      );

      onClose();
    } catch (err) {
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
              <label>First Name</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} style={styles.input} />
              {errors.first_name && <p style={styles.fieldError}>{errors.first_name[0]}</p>}
            </div>

            <div style={styles.formGroup}>
              <label>Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} style={styles.input} />
              {errors.last_name && <p style={styles.fieldError}>{errors.last_name[0]}</p>}
            </div>
          </div>

          {/* Username & Email */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label>Username</label>
              <input name="username" value={formData.username} onChange={handleChange} style={styles.input} />
              {errors.username && <p style={styles.fieldError}>{errors.username[0]}</p>}
            </div>

            <div style={styles.formGroup}>
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} />
              {errors.email && <p style={styles.fieldError}>{errors.email[0]}</p>}
            </div>
          </div>

          {/* Passwords */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} />
              {errors.password && <p style={styles.fieldError}>{errors.password[0]}</p>}
            </div>

            <div style={styles.formGroup}>
              <label>Confirm Password</label>
              <input type="password" name="password2" value={formData.password2} onChange={handleChange} style={styles.input} />
              {errors.password2 && <p style={styles.fieldError}>{errors.password2[0]}</p>}
            </div>
          </div>

          {/* Role & Company */}
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label>I am a</label>
              <select name="role" value={formData.role} onChange={handleChange} style={styles.select}>
                <option value="buyer">Buyer</option>
                <option value="manufacturer">Manufacturer</option>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Company Name</label>
              <input name="company_name" value={formData.company_name} onChange={handleChange} style={styles.input} />
            </div>
          </div>

          {/* Phone */}
          <div style={styles.formGroup}>
            <label>Phone Number</label>
            <input name="phone_number" value={formData.phone_number} onChange={handleChange} style={styles.input} />
            {errors.phone_number && <p style={styles.fieldError}>{errors.phone_number[0]}</p>}
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
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
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal: { background: '#fff', borderRadius: 12, width: '90%', maxWidth: 520 },
  header: { padding: '1rem', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' },
  title: { margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem' },
  form: { padding: '1.5rem' },
  row: { display: 'flex', gap: '1rem' },
  formGroup: { flex: 1, marginBottom: '1rem' },
  input: { width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: 6 },
  select: { width: '100%', padding: '0.75rem', border: '1px solid #ccc', borderRadius: 6 },
  submitBtn: { width: '100%', padding: '0.75rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6 },
  errorAlert: { background: '#fee', color: '#c0392b', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' },
  fieldError: { color: '#c0392b', fontSize: '0.8rem', marginTop: '0.25rem' },
  footer: { textAlign: 'center', marginTop: '1rem' },
  linkBtn: { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer' },
};

export default RegisterModal;
