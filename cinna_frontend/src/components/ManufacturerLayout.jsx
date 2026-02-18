// src/components/ManufacturerLayout.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI, removeAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard',       icon: '⊞', path: '/manufacturer/dashboard'       },
  { label: 'My Tenders',      icon: '📋', path: '/manufacturer/my-tenders'      },
  { label: 'Create Tender',   icon: '＋', path: '/manufacturer/create-tender'   },
  { label: 'Quality Grading', icon: '⭐', path: '/manufacturer/quality-grading' },
  { label: 'Analytics',       icon: '📊', path: '/manufacturer/analytics'       },
];

// Safely build a full image URL from whatever the backend returns
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000${path}`;
};

// Avatar: shows profile picture when available, falls back to initials
function Avatar({ picturePath, initials, size = 30, fontSize = '0.72rem', border = 'none' }) {
  const [imgError, setImgError] = useState(false);
  // Reset error whenever the picture path changes (new upload)
  useEffect(() => { setImgError(false); }, [picturePath]);

  const url = getImageUrl(picturePath);
  const base = { width: size, height: size, borderRadius: '50%', flexShrink: 0, border };

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt="Profile"
        style={{ ...base, objectFit: 'cover' }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <span style={{ ...base, backgroundColor: '#d4922a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize, fontWeight: 700 }}>
      {initials}
    </span>
  );
}

export default function ManufacturerLayout({ children }) {
  // ✅ FIX: use `user` from AuthContext (reactive) instead of getUser() (stale localStorage snapshot)
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [showDrop, setShowDrop] = useState(false);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setShowDrop(false);
    try {
      const rt = localStorage.getItem('refresh_token');
      if (rt) await authAPI.logout(rt);
    } catch { /* ignore */ } finally {
      removeAuthToken();
      logout();
      navigate('/');
    }
  };

  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()
    || user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div style={s.root}>

      {/* ── NAVBAR ── */}
      <header style={s.navbar}>
        <div style={s.navBrand} onClick={() => navigate('/manufacturer/dashboard')}>
          <span style={s.brandIcon}>🌿</span>
          <span style={s.brandText}>CinnaTend</span>
        </div>

        <div style={s.profileWrap} ref={dropRef}>
          <button style={s.profileBtn} onClick={() => setShowDrop(p => !p)}>
            {/* ✅ Navbar button avatar — picture or initials */}
            <Avatar
              picturePath={user?.profile_picture}
              initials={initials}
              size={30}
              fontSize="0.72rem"
              border="2px solid rgba(255,255,255,0.25)"
            />
            <span style={s.profileName}>{user?.first_name || user?.username}</span>
            <span style={{ ...s.chevron, transform: showDrop ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
          </button>

          {showDrop && (
            <div style={s.dropdown}>
              <div style={s.dropHead}>
                {/* ✅ Dropdown header avatar — picture or initials */}
                <Avatar
                  picturePath={user?.profile_picture}
                  initials={initials}
                  size={36}
                  fontSize="0.82rem"
                  border="2px solid #e2e8f0"
                />
                <div>
                  <p style={s.dropName}>{user?.first_name} {user?.last_name}</p>
                  <p style={s.dropRole}>🏭 Manufacturer</p>
                </div>
              </div>

              <div style={s.dropDivider} />

              <button style={s.dropItem}
                onClick={() => { setShowDrop(false); navigate('/profile'); }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={s.dropIcon}>👤</span> My Profile
              </button>

              <div style={s.dropDivider} />

              <button style={{ ...s.dropItem, color: '#dc2626' }}
                onClick={handleLogout}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={s.dropIcon}>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div style={s.body}>
        {/* ── SIDEBAR ── */}
        <aside style={s.sidebar}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path}
                style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                onClick={() => navigate(item.path)}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f0f4f8'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* ── PAGE CONTENT ── */}
        <main style={s.main}>{children}</main>
      </div>
    </div>
  );
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  navbar:      { height: 64, backgroundColor: '#1a2e44', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', position: 'sticky', top: 0, zIndex: 200, flexShrink: 0 },
  navBrand:    { display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer', userSelect: 'none' },
  brandIcon:   { fontSize: '1.4rem' },
  brandText:   { color: '#f6f5f4ff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.4px' },
  profileWrap: { position: 'relative' },
  profileBtn:  { display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.4rem 0.85rem 0.4rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: '0.88rem', fontWeight: 500 },
  profileName: { color: '#e2e8f0', fontSize: '0.88rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chevron:     { color: '#94a3b8', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block' },
  dropdown:    { position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 220, zIndex: 300, overflow: 'hidden', border: '1px solid #e2e8f0' },
  dropHead:    { display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.9rem 1rem', backgroundColor: '#f8fafc' },
  dropName:    { margin: 0, fontWeight: 700, color: '#1a2e44', fontSize: '0.88rem' },
  dropRole:    { margin: '0.12rem 0 0', color: '#64748b', fontSize: '0.76rem' },
  dropDivider: { height: 1, backgroundColor: '#e2e8f0' },
  dropItem:    { display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#1a2e44', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s' },
  dropIcon:    { fontSize: '0.95rem', minWidth: 20, textAlign: 'center' },
  body:        { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar:     { width: 220, minWidth: 220, backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' },
  navItem:     { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.62rem 0.85rem', border: 'none', borderRadius: 7, backgroundColor: 'transparent', color: '#4a5568', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s, color 0.15s' },
  navActive:   { backgroundColor: '#27ae60', color: '#fff' },
  navIcon:     { fontSize: '0.95rem', minWidth: 18, textAlign: 'center' },
  main:        { flex: 1, padding: '2rem', overflowY: 'auto' },
};