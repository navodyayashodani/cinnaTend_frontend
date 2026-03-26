// src/components/ManufacturerLayout.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, authAPI, removeAuthToken, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatPanel from './ChatPanel';
import { chatAPI } from "../services/api";

const NAV_ITEMS = [
  { label: 'Dashboard',       icon: '⊞', path: '/manufacturer/dashboard'       },
  { label: 'My Tenders',      icon: '📋', path: '/manufacturer/my-tenders'      },
  { label: 'Create Tender',   icon: '＋', path: '/manufacturer/create-tender'   },
  { label: 'Quality Grading', icon: '⭐', path: '/manufacturer/quality-grading' },
  { label: 'Analytics',       icon: '📊', path: '/manufacturer/analytics'       },
  { label: 'My Profile',      icon: '👤', path: '/profile'                      },
];

export default function ManufacturerLayout({ children }) {
  const user          = getUser();
  const { logout }    = useAuth();
  const navigate      = useNavigate();
  const location      = useLocation();
  const [chatOpen, setChatOpen]       = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // ✅ Track screen size

  // ✅ Listen for window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileMenuOpen(false); // Close menu when switching to desktop
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchUnread = () => {
      chatAPI.getUnreadCount()
        .then(data => setUnreadCount(data.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleOpenChat = () => {
    setChatOpen(true);
    setUnreadCount(0);
  };

  const handleLogout = async () => {
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

  const profileImage = getImageUrl(user?.profile_picture);

  // ✅ Dynamic styles based on mobile state
  const sidebarStyle = {
    ...s.sidebar,
    ...(isMobile ? {
      position: 'fixed',
      left: mobileMenuOpen ? 0 : -260,
      top: 0,
      height: '100vh',
      zIndex: 1000,
      transition: 'left 0.3s ease',
      boxShadow: mobileMenuOpen ? '2px 0 12px rgba(0,0,0,0.1)' : 'none',
    } : {})
  };

  const mainStyle = {
    ...s.main,
    ...(isMobile ? {
      width: '100%',
      padding: '1rem',
      paddingTop: '5rem', // Space for hamburger button
    } : {})
  };

  return (
    <div style={s.root}>

      {/* ✅ MOBILE MENU BUTTON - Only show on mobile */}
      {isMobile && (
        <button 
          style={s.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* ✅ MOBILE OVERLAY - Only show on mobile when menu is open */}
      {isMobile && mobileMenuOpen && (
        <div 
          style={s.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={sidebarStyle}>
        {/* Brand */}
        <div style={s.brandSection} onClick={() => navigate('/manufacturer/dashboard')}>
          <span style={s.brandIcon}>🌿</span>
          <span style={s.brandText}>CinnaTend</span>
        </div>

        <div style={s.divider} />

        {/* User profile */}
        <div style={s.userSection}>
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              style={s.avatarImg}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          {!profileImage && <div style={s.avatarLarge}>{initials}</div>}
          {profileImage && <div style={{ ...s.avatarLarge, display: 'none' }}>{initials}</div>}
          <p style={s.userName}>{user?.first_name} {user?.last_name}</p>
          <p style={s.userRole}>🏭 Manufacturer</p>
        </div>

        <div style={s.divider} />

        {/* Nav items */}
        <div style={s.navSection}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button key={item.path}
                style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileMenuOpen(false); // Close menu on mobile after click
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f0f4f8'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          {/* ── CHAT NAV ITEM ── */}
          <button
            style={{
              ...s.navItem,
              ...(chatOpen ? s.navActive : {}),
              position: 'relative',
            }}
            onClick={() => {
              handleOpenChat();
              if (isMobile) setMobileMenuOpen(false);
            }}
            onMouseEnter={e => { if (!chatOpen) e.currentTarget.style.backgroundColor = '#f0f4f8'; }}
            onMouseLeave={e => { if (!chatOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span style={s.navIcon}>💬</span>
            Chat
            {unreadCount > 0 && (
              <span style={s.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {/* ✅ MOBILE ONLY LOGOUT */}
          {isMobile && (
            <button
              style={{ ...s.navItem, ...s.logoutBtn }}
              onClick={handleLogout}
            >
              <span style={s.navIcon}>🚪</span>
              Logout
            </button>
          )}

        </div>

        {/* Logout */}
        {!isMobile && (
        <div style={s.bottomSection}>
          <button style={{ ...s.navItem, ...s.logoutBtn }}
            onClick={handleLogout}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fff5f5'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span style={s.navIcon}>🚪</span>
            Logout
          </button>
        </div>
        )}
      </aside>

      {/* ── PAGE CONTENT ── */}
      <main style={mainStyle}>{children}</main>

      {/* ── CHAT PANEL OVERLAY ── */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentUserRole="manufacturer"
      />
    </div>
  );
}

const s = {
  root:          { display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden', position: 'relative' },
  sidebar:       { width: 260, minWidth: 260, backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'hidden', flexShrink: 0 },

  // ✅ Mobile menu button
  mobileMenuBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'fixed',
    top: '1rem',
    left: '1rem',
    zIndex: 1001,
    background: '#27ae60',
    color: 'white',
    border: 'none',
    width: 44,
    height: 44,
    borderRadius: 8,
    fontSize: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    transition: 'background-color 0.2s',
  },

  // ✅ Overlay backdrop
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    backdropFilter: 'blur(2px)',
  },

  brandSection:  { padding: '1.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', userSelect: 'none', flexShrink: 0 },
  brandIcon:     { fontSize: '1.6rem' },
  brandText:     { color: '#d4922a', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.4px' },

  userSection:   { padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 },
  avatarLarge:   { width: 70, height: 70, borderRadius: '50%', backgroundColor: '#27ae60', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 },
  avatarImg:     { width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e2e8f0' },
  userName:      { margin: '0.25rem 0 0', fontWeight: 700, color: '#1a2e44', fontSize: '0.95rem', textAlign: 'center' },
  userRole:      { margin: 0, color: '#64748b', fontSize: '0.8rem' },

  divider:       { height: 1, backgroundColor: '#e2e8f0', margin: '0 0.75rem', flexShrink: 0 },

  navSection:    { flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' },
  navItem:       { display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 1rem', border: 'none', borderRadius: 7, backgroundColor: 'transparent', color: '#4a5568', fontSize: '0.92rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s, color 0.15s', width: '100%', flexShrink: 0 },
  navActive:     { backgroundColor: '#27ae60', color: '#fff' },
  navIcon:       { fontSize: '1rem', minWidth: 20, textAlign: 'center' },

  badge: {
    marginLeft: 'auto',
    background: '#ef4444', color: '#fff',
    borderRadius: 999, fontSize: '0.7rem', fontWeight: 700,
    padding: '2px 7px', minWidth: 20, textAlign: 'center',
  },

  bottomSection: { padding: '0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0, marginTop: 'auto' },
  logoutBtn:     { color: '#dc2626' },

  main:          { flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' },
};