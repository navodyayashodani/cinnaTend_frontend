// src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, removeAuthToken, getImageUrl } from '../services/api';

/* ── Inject navbar CSS once ── */
const NAV_STYLE_ID = 'cin-navbar-styles';
if (!document.getElementById(NAV_STYLE_ID)) {
  const s = document.createElement('style');
  s.id = NAV_STYLE_ID;
  s.textContent = `
    /* Hamburger: hidden on desktop, visible on mobile */
    .nav-hamburger {
      display: none;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      color: #fff;
      font-size: 1.4rem;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      cursor: pointer;
      line-height: 1;
    }

    /* Nav right: visible on desktop */
    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* Mobile dropdown (login/register only) */
    .nav-right-mobile-open {
      position: absolute;
      top: 64px;
      right: 1rem;
      background: #1a2e44;
      flex-direction: column;
      padding: 0.75rem;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      min-width: 160px;
      z-index: 300;
      gap: 0.5rem;
    }

    /* Login / Register buttons full-width on mobile dropdown */
    .nav-right-mobile-open .nav-login-btn,
    .nav-right-mobile-open .nav-register-btn {
      width: 100%;
      justify-content: center;
    }

    .nav-login-btn {
      padding: 0.5rem 1.4rem;
      background: transparent;
      color: #fff;
      border: 1.5px solid rgba(255,255,255,0.5);
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background 0.2s, color 0.2s;
    }
    .nav-login-btn:hover {
      background: #fff;
      color: #1a2e44;
    }

    .nav-register-btn {
      padding: 0.5rem 1.4rem;
      background: #27ae60;
      color: #fff;
      border: 1.5px solid #27ae60;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: background 0.2s;
    }
    .nav-register-btn:hover {
      background: #1e8449;
    }

    @media (max-width: 768px) {
      .nav-hamburger {
        display: block;
      }
      /* Hide nav-right by default on mobile (for guests only) */
      .nav-right-guest {
        display: none;
      }
      /* Show when open */
      .nav-right-guest.nav-right-mobile-open {
        display: flex;
      }
    }
  `;
  document.head.appendChild(s);
}

/* ── Avatar ── */
function Avatar({ picturePath, initials, size = 30, fontSize = '0.72rem', border = '2px solid rgba(255,255,255,0.25)' }) {
  const [imgError, setImgError] = useState(false);
  const url = getImageUrl(picturePath);
  useEffect(() => { setImgError(false); }, [picturePath]);

  if (url && !imgError) {
    return (
      <img src={url} alt="Profile"
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

/* ── Navbar ── */
function Navbar({ onLoginClick, onRegisterClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [showDrop, setShowDrop] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = async () => {
    setShowDrop(false);
    setMobileOpen(false);
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
    <nav style={{
      height: 64, backgroundColor: '#1a2e44',
      display: 'flex', alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      <div style={{
        width: '100%', padding: '0 1.5rem',
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', position: 'relative',
      }}>

        {/* ── Brand ── */}
        <div onClick={handleBrandClick} style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          cursor: 'pointer', userSelect: 'none', transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span style={{ fontSize: '1.4rem' }}>🌿</span>
          <span style={{ color: '#ededed', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.4px' }}>CinnaTend</span>
        </div>

        {/* ── Guest: hamburger on mobile ── */}
        {!user && (
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(p => !p)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        )}

        {/* ── Guest nav (Login + Register) ── */}
        {!user && (
          <div className={`nav-right nav-right-guest ${mobileOpen ? 'nav-right-mobile-open' : ''}`}>
            <button className="nav-login-btn" onClick={() => { setMobileOpen(false); onLoginClick(); }}>
              Login
            </button>
            <button className="nav-register-btn" onClick={() => { setMobileOpen(false); onRegisterClick(); }}>
              Register
            </button>
          </div>
        )}

        {/* ── Logged-in: profile dropdown ── */}
        {user && (
          <div style={{ position: 'relative' }} ref={dropRef}>
            <button
              onClick={() => setShowDrop(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.55rem',
                padding: '0.4rem 0.85rem 0.4rem 0.5rem',
                backgroundColor: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, cursor: 'pointer',
                color: '#fff', fontSize: '0.88rem', fontWeight: 500,
              }}
            >
              <Avatar picturePath={user.profile_picture} initials={initials} size={30} fontSize="0.72rem" />
              <span style={{
                color: '#e2e8f0', fontSize: '0.88rem',
                maxWidth: 110, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user.first_name || user.username}
              </span>
              <span style={{
                color: '#94a3b8', fontSize: '0.75rem',
                transition: 'transform 0.2s',
                display: 'inline-block',
                transform: showDrop ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>▾</span>
            </button>

            {showDrop && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                backgroundColor: '#fff', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                minWidth: 220, zIndex: 300, overflowY: 'auto',        
                minHeight: '0',        
                border: '1px solid #e2e8f0',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.9rem 1rem', backgroundColor: '#f8fafc' }}>
                  <Avatar picturePath={user.profile_picture} initials={initials} size={36} fontSize="0.82rem" border="2px solid #e2e8f0" />
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#1a2e44', fontSize: '0.88rem' }}>{user.first_name} {user.last_name}</p>
                    <p style={{ margin: '0.12rem 0 0', color: '#64748b', fontSize: '0.76rem' }}>
                      {user.role === 'manufacturer' ? '🏭 Manufacturer' : '🛒 Buyer'}
                    </p>
                  </div>
                </div>

                <div style={{ height: 1, backgroundColor: '#e2e8f0' }} />

                <button
                  onClick={() => { setShowDrop(false); navigate('/profile'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#1a2e44', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4f8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '0.95rem', minWidth: 20, textAlign: 'center' }}>👤</span>
                  My Profile
                </button>

                <div style={{ height: 1, backgroundColor: '#e2e8f0' }} />

                <button
                  onClick={handleLogout}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.7rem 1rem', border: 'none', backgroundColor: 'transparent', color: '#dc2626', fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '0.95rem', minWidth: 20, textAlign: 'center' }}>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </nav>
  );
}

export default Navbar;