import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getImageUrl } from '../services/api';

export default function ResponsiveLayout({ children, user, navItems, roleTitle, roleColor }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || '?';
  const profileImage = getImageUrl(user?.profile_picture);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        
        {/* Brand & Toggle */}
        <div style={styles.brandSection}>
          <div style={styles.brand} onClick={() => navigate('/')}>
            <span style={{fontSize: '1.6rem'}}>🌿</span>
            <span style={styles.brandText}>CinnaTend</span>
          </div>
          <button className="hide-desktop" onClick={() => setMenuOpen(!menuOpen)} style={styles.menuBtn}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Sidebar Content (Hidden on mobile until toggled) */}
        <div className="sidebar-nav-mobile">
          <div style={styles.userCard}>
            {profileImage ? (
              <img src={profileImage} alt="Profile" style={styles.avatar} />
            ) : (
              <div style={{...styles.avatar, backgroundColor: roleColor || '#d4922a'}}>{initials}</div>
            )}
            <h4 style={{margin: '10px 0 0'}}>{user?.first_name} {user?.last_name}</h4>
            <span style={{fontSize: '0.75rem', color: '#64748b'}}>{roleTitle}</span>
          </div>

          <nav style={styles.navLinks}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMenuOpen(false); }}
                  style={{
                    ...styles.navBtn,
                    backgroundColor: isActive ? (roleColor || '#27ae60') : 'transparent',
                    color: isActive ? '#fff' : '#4a5568'
                  }}
                >
                  <span style={{marginRight: '12px'}}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

const styles = {
  brandSection: { padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  brandText: { fontWeight: 800, fontSize: '1.3rem', color: '#d4922a' },
  menuBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  userCard: { padding: '1rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' },
  avatar: { width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', objectFit: 'cover' },
  navLinks: { display: 'flex', flexDirection: 'column', gap: '5px', padding: '0 1rem' },
  navBtn: { display: 'flex', alignItems: 'center', padding: '12px 15px', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500', transition: '0.2s' }
};