// src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, removeAuthToken } from '../services/api';

const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `http://127.0.0.1:8000${path}`;
};

// Reusable avatar: shows profile picture if available, else initials
function Avatar({ picturePath, initials, size = 30, fontSize = '0.72rem', border = '2px solid rgba(255,255,255,0.25)' }) {
  const [imgError, setImgError] = useState(false);
  const url = getImageUrl(picturePath);

  // Reset error state if picturePath changes (new upload)
  useEffect(() => { setImgError(false); }, [picturePath]);

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt="Profile"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border }}
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: '#d4922a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </span>
  );
}

function Navbar({ onLoginClick, onRegisterClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // ✅ reads from context — auto-updates when updateUser() called

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

  const handleBrandClick = () => {
    if (user) {
      const target = user.role === 'manufacturer' ? '/manufacturer-dashboard' : '/buyer-dashboard';
      if (location.pathname !== target) navigate(target);
    } else {
      if (location.pathname !== '/') navigate('/');
    }
  };

  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()
    || user?.username?.[0]?.toUpperCase() || '?';

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Brand */}
        <div style={styles.brand} onClick={handleBrandClick}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
          <span style={styles.brandIcon}>🌿</span>
          <span style={styles.brandText}>CinnaTend</span>
        </div>

        {/* Right side */}
        <div style={styles.navRight}>
          {user ? (
            <div style={styles.profileWrap} ref={dropRef}>
              <button style={styles.profileBtn} onClick={() => setShowDrop(p => !p)}>
                {/* ✅ Navbar button avatar */}
                <Avatar picturePath={user.profile_picture} initials={initials} size={30} fontSize="0.72rem" />
                <span style={styles.profileName}>{user.first_name || user.username}</span>
                <span style={{ ...styles.chevron, transform: showDrop ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>

              {showDrop && (
                <div style={styles.dropdown}>
                  <div style={styles.dropHead}>
                    {/* ✅ Dropdown header avatar */}
                    <Avatar picturePath={user.profile_picture} initials={initials} size={36} fontSize="0.82rem" border="2px solid #e2e8f0" />
                    <div>
                      <p style={styles.dropName}>{user.first_name} {user.last_name}</p>
                      <p style={styles.dropRole}>{user.role === 'manufacturer' ? '🏭 Manufacturer' : '🛒 Buyer'}</p>
                    </div>
                  </div>

                  <div style={styles.dropDivider} />

                  <button style={styles.dropItem}
                    onClick={() => { setShowDrop(false); navigate('/profile'); }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={styles.dropIcon}>👤</span>
                    My Profile
                  </button>

                  <div style={styles.dropDivider} />

                  <button style={{ ...styles.dropItem, color: '#dc2626' }}
                    onClick={handleLogout}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <span style={styles.dropIcon}>🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button onClick={onLoginClick} style={styles.loginBtn}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fff'; e.currentTarget.style.color = '#1a2e44'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#fff'; }}>
                Login
              </button>
              <button onClick={onRegisterClick} style={styles.registerBtn}>Register</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar:     { height: 64, backgroundColor: '#1a2e44', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 200 },
  container:  { width: '100%', padding: '0 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand:      { display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', transition: 'opacity 0.2s', userSelect: 'none' },
  brandIcon:  { fontSize: '1.4rem' },
  brandText:  { color: '#ededed', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.4px' },
  navRight:   { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  profileWrap:{ position: 'relative' },
  profileBtn: { display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.4rem 0.85rem 0.4rem 0.5rem', backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: '0.88rem', fontWeight: 500 },
  profileName:{ color: '#e2e8f0', fontSize: '0.88rem', maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chevron:    { color: '#94a3b8', fontSize: '0.75rem', transition: 'transform 0.2s', display: 'inline-block' },
  dropdown:   { position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 220, zIndex: 300, overflow: 'hidden', border: '1px solid #e2e8f0' },
  dropHead:   { display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.9rem 1rem', backgroundColor: '#f8fafc' },
  dropName:   { margin: 0, fontWeight: 700, color: '#1a2e44', fontSize: '0.88rem' },
  dropRole:   { margin: '0.12rem 0 0', color: '#64748b', fontSize: '0.76rem' },
  dropDivider:{ height: 1, backgroundColor: '#e2e8f0' },
  dropItem:   { display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#1a2e44', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' },
  dropIcon:   { fontSize: '0.95rem', minWidth: 20, textAlign: 'center' },
  loginBtn:   { padding: '0.5rem 1.4rem', backgroundColor: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 },
  registerBtn:{ padding: '0.5rem 1.4rem', backgroundColor: '#27ae60', color: '#fff', border: '1.5px solid #27ae60', borderRadius: 6, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
};

export default Navbar;