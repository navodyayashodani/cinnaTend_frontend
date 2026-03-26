// src/components/AdminLayout.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUser, authAPI, removeAuthToken } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChatPanel from './ChatPanel';
import { chatAPI } from '../services/api';

const NAV_ITEMS = [
  { label: 'Dashboard',       icon: '⊞', path: '/admin/dashboard'        },
  { label: 'User Management', icon: '👥', path: '/admin/users'            },
  { label: 'Tender Overview', icon: '📋', path: '/admin/tenders'          },
  { label: 'Bid Management',  icon: '💰', path: '/admin/bids'             },
  { label: 'Grading Reports', icon: '⭐', path: '/admin/grading-reports'  },
  { label: 'Activity Logs',   icon: '📝', path: '/admin/activity-logs'    },
  { label: 'System Reports',  icon: '📊', path: '/admin/reports'          },
  { label: 'My Profile',      icon: '👤', path: '/profile'                },
];

export default function AdminLayout({ children }) {
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
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

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

  const initials = (
    (user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')
  ).toUpperCase() || user?.username?.[0]?.toUpperCase() || '?';

  const profileImage = user?.profile_picture
    ? (user.profile_picture.startsWith('http')
        ? user.profile_picture
        : `http://127.0.0.1:8000${user.profile_picture}`)
    : null;

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
      paddingTop: '5rem',
    } : {})
  };

  return (
    <div style={s.root}>

      {/* ✅ MOBILE MENU BUTTON */}
      {isMobile && (
        <button 
          style={s.mobileMenuBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      )}

      {/* ✅ MOBILE OVERLAY */}
      {isMobile && mobileMenuOpen && (
        <div 
          style={s.overlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={sidebarStyle}>

        <div style={s.brandSection} onClick={() => navigate('/admin/dashboard')}>
          <span style={s.brandIcon}>🌿</span>
          <span style={s.brandText}>CinnaTend</span>
          <span style={s.adminBadge}>Admin</span>
        </div>

        <div style={s.divider} />

        <div style={s.userSection}>
          {profileImage ? (
            <>
              <img
                src={profileImage}
                alt="Profile"
                style={s.avatarImg}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{ ...s.avatarLarge, display: 'none' }}>{initials}</div>
            </>
          ) : (
            <div style={s.avatarLarge}>{initials}</div>
          )}
          <p style={s.userName}>{user?.first_name} {user?.last_name}</p>
          <p style={s.userRole}>🛡️ System Administrator</p>
        </div>

        <div style={s.divider} />

        <div style={s.navSection}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                style={{ ...s.navItem, ...(active ? s.navActive : {}) }}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileMenuOpen(false);
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#f0f4f8'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <span style={s.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

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

        {!isMobile && (
        <div style={s.bottomSection}>
          <button
            style={{ ...s.navItem, ...s.logoutBtn }}
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

      <main style={mainStyle}>{children}</main>

      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        currentUserRole="admin"
      />

    </div>
  );
}

const s = {
  root:         { display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: 'hidden', position: 'relative' },
  sidebar:      { width: 260, minWidth: 260, backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflowY: 'hidden', flexShrink: 0 },

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

  brandSection: { padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', flexShrink: 0 },
  brandIcon:    { fontSize: '1.6rem' },
  brandText:    { color: '#d4922a', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.4px' },
  adminBadge:   { marginLeft: 'auto', backgroundColor: '#27ae60', color: '#fff', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', letterSpacing: '0.5px', textTransform: 'uppercase' },

  userSection:  { padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flexShrink: 0 },
  avatarLarge:  { width: 70, height: 70, borderRadius: '50%', backgroundColor: '#27ae60', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 },
  avatarImg:    { width: 70, height: 70, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid #e2e8f0' },
  userName:     { margin: '0.25rem 0 0', fontWeight: 700, color: '#1a2e44', fontSize: '0.95rem', textAlign: 'center' },
  userRole:     { margin: 0, color: '#64748b', fontSize: '0.8rem', fontWeight: 600 },

  divider:      { height: 1, backgroundColor: '#e2e8f0', margin: '0 0.75rem', flexShrink: 0 },

  navSection:   { flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', overflowY: 'auto' },
  navItem:      { display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 1rem', border: 'none', borderRadius: 7, backgroundColor: 'transparent', color: '#4a5568', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.15s, color 0.15s', width: '100%', flexShrink: 0 },
  navActive:    { backgroundColor: '#27ae60', color: '#fff' },
  navIcon:      { fontSize: '1rem', minWidth: 20, textAlign: 'center' },

  badge:        { marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', minWidth: 20, textAlign: 'center' },

  bottomSection: { padding: '0.75rem', borderTop: '1px solid #e2e8f0', flexShrink: 0 },
  logoutBtn:     { color: '#dc2626' },

  main:          { flex: 1, padding: '2rem', overflowY: 'auto', height: '100vh' },
};