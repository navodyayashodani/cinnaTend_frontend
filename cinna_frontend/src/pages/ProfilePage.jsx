// src/pages/ProfilePage.jsx

import React, { useState, useRef } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ManufacturerLayout from '../components/ManufacturerLayout';
import BuyerLayout from '../components/BuyerLayout';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000${path}`;
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    company_name: user?.company_name || '',
  });

  const displayImage = removeImage
    ? null
    : (imagePreview || getImageUrl(user?.profile_picture));

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageClick = () => { if (editing) fileInputRef.current?.click(); };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, and WebP images are allowed');
      return;
    }
    setProfileImage(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCancel = () => {
    setEditing(false);
    setProfileImage(null);
    setImagePreview(null);
    setRemoveImage(false);
    setFormData({
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
      company_name: user?.company_name || '',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    try {
      const payload = new FormData();

      Object.keys(formData).forEach((key) => {
        if (formData[key] !== (user?.[key] || '')) payload.append(key, formData[key]);
      });

      if (profileImage) {
        payload.append('profile_picture', profileImage);
      } else if (removeImage) {
        payload.append('profile_picture', '');
      }

      const hasChanges = profileImage || removeImage || [...payload.keys()].length > 0;
      if (!hasChanges) {
        setEditing(false);
        return;
      }

      const response = await authAPI.updateProfile(payload);
      const updatedUser = response.data.user;

      updateUser(updatedUser);

      setImagePreview(null);
      setProfileImage(null);
      setRemoveImage(false);
      setEditing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';

      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      const msg = error.response?.data?.email?.[0]
        || error.response?.data?.phone_number?.[0]
        || error.response?.data?.profile_picture?.[0]
        || error.response?.data?.error
        || 'Failed to update profile. Please try again.';
      alert(msg);
    }
  };

  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()
    || user?.username?.[0]?.toUpperCase() || '?';

  // Choose layout based on user role
  const Layout = user?.role === 'manufacturer' ? ManufacturerLayout : BuyerLayout;

  return (
    <Layout>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>My Profile</h2>
          <p style={s.pageSubtitle}>Manage your account information and settings</p>
        </div>
      </div>

      {/* Profile card */}
      <div style={s.card}>
        {/* Avatar and basic info */}
        <div style={s.cardHeader}>
          <div style={s.avatarWrap}>
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                style={{ ...s.avatarImg, cursor: editing ? 'pointer' : 'default' }}
                onClick={handleImageClick}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <div
                style={{ ...s.avatarInitials, cursor: editing ? 'pointer' : 'default' }}
                onClick={handleImageClick}
              >
                {initials}
              </div>
            )}

            {editing && (
              <div style={s.imageActions}>
                <button style={s.imageBtn} onClick={handleImageClick}>
                  📷 {displayImage ? 'Change' : 'Upload'}
                </button>
                {(displayImage || user?.profile_picture) && (
                  <button style={s.imageBtnRemove} onClick={handleRemoveImage}>
                    🗑️ Remove
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </div>

          <div>
            <h3 style={s.cardTitle}>{user?.first_name} {user?.last_name}</h3>
            <p style={s.cardSubtitle}>
              {user?.role === 'manufacturer' ? '🏭 Manufacturer' : '🛒 Buyer'} · {user?.email}
            </p>
          </div>
        </div>

        <div style={s.divider} />

        {/* Profile Information */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <h3 style={s.sectionTitle}>Profile Information</h3>
            {!editing ? (
              <button style={s.editBtn} onClick={() => setEditing(true)}>✏️ Edit</button>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={s.cancelBtn} onClick={handleCancel}>Cancel</button>
                <button style={s.saveBtn} onClick={handleSave}>💾 Save</button>
              </div>
            )}
          </div>
          <div style={s.formGrid}>
            {[
              { label: 'First Name', name: 'first_name', value: formData.first_name },
              { label: 'Last Name', name: 'last_name', value: formData.last_name },
              { label: 'Email', name: 'email', value: formData.email },
              { label: 'Phone', name: 'phone_number', value: formData.phone_number },
              { label: 'Company Name', name: 'company_name', value: formData.company_name },
            ].map(field => (
              <div key={field.name} style={s.formField}>
                <label style={s.label}>{field.label}</label>
                {editing ? (
                  <input
                    style={s.input}
                    type="text"
                    name={field.name}
                    value={field.value}
                    onChange={handleChange}
                  />
                ) : (
                  <p style={s.value}>{field.value || '—'}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={s.divider} />

        {/* Account Details */}
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Account Details</h3>
          <div style={s.formGrid}>
            <div style={s.formField}>
              <label style={s.label}>Username</label>
              <p style={s.value}>{user?.username}</p>
            </div>
            <div style={s.formField}>
              <label style={s.label}>User ID</label>
              <p style={s.value}>#{user?.id}</p>
            </div>
            <div style={s.formField}>
              <label style={s.label}>Role</label>
              <p style={s.value}>{user?.role === 'manufacturer' ? 'Manufacturer' : 'Buyer'}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const s = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle: { margin: '0 0 0.3rem', color: '#1a2e44', fontSize: '1.4rem', fontWeight: 700 },
  pageSubtitle: { margin: 0, color: '#64748b', fontSize: '0.9rem' },

  card: { backgroundColor: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '2rem', marginBottom: '1.5rem' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' },
  avatarWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' },
  avatarImg: { width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '3px solid #e2e8f0' },
  avatarInitials: { width: 100, height: 100, borderRadius: '50%', backgroundColor: '#d4922a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 700, flexShrink: 0 },
  imageActions: { display: 'flex', gap: '0.5rem' },
  imageBtn: { padding: '0.35rem 0.75rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  imageBtnRemove: { padding: '0.35rem 0.75rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  cardTitle: { margin: '0 0 0.3rem', color: '#1a2e44', fontSize: '1.3rem', fontWeight: 700 },
  cardSubtitle: { margin: 0, color: '#64748b', fontSize: '0.9rem' },

  divider: { height: 1, backgroundColor: '#e2e8f0', margin: '1.5rem 0' },

  section: { marginBottom: '1rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  sectionTitle: { margin: 0, color: '#1a2e44', fontSize: '1.1rem', fontWeight: 700 },
  editBtn: { padding: '0.4rem 0.9rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  cancelBtn: { padding: '0.4rem 0.9rem', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },
  saveBtn: { padding: '0.4rem 0.9rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 },

  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  formField: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.82rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' },
  value: { margin: 0, fontSize: '0.95rem', color: '#1a2e44', fontWeight: 500 },
  input: { padding: '0.6rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 6, fontSize: '0.9rem', color: '#1a2e44', fontWeight: 500 },
};