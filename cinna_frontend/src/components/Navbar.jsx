// src/components/Navbar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, removeAuthToken } from '../services/api';

function Navbar({ onLoginClick, onRegisterClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      // Try to blacklist the refresh token on the server
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // ✅ Clear auth state and tokens
      removeAuthToken(); // Clear localStorage
      logout(); // Clear context state
      
      // Navigate to home
      navigate('/');
    }
  };

  const handleBrandClick = () => {
    if (user) {
      const targetPath =
        user.role === 'manufacturer'
          ? '/manufacturer-dashboard'
          : '/buyer-dashboard';

      if (location.pathname !== targetPath) {
        navigate(targetPath);
      }
    } else {
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div
          style={styles.brand}
          onClick={handleBrandClick}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <span style={styles.icon}>🌿</span>
          <h1 style={styles.title}>Cinnamon Oil Tendering</h1>
        </div>

        <div style={styles.navLinks}>
          {user ? (
            <>
              <div style={styles.userInfo}>
                <span style={styles.welcome}>
                  👋 Welcome, <strong>{user.first_name || user.username}</strong>
                </span>
                <span style={styles.roleBadge}>
                  {user.role === 'manufacturer'
                    ? '🏭 Manufacturer'
                    : '🛒 Buyer'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#c0392b')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#e74c3c')
                }
              >
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                style={styles.loginBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.color = '#2c3e50';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                Login
              </button>

              <button
                onClick={onRegisterClick}
                style={styles.registerBtn}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#229954')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#27ae60')
                }
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#2c3e50',
    padding: '1rem 0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
  },
  icon: {
    fontSize: '2rem',
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '600',
  },
  navLinks: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginRight: '1rem',
  },
  welcome: {
    color: '#ecf0f1',
    fontSize: '0.95rem',
  },
  roleBadge: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    color: '#3498db',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
  },
  loginBtn: {
    padding: '0.6rem 1.75rem',
    backgroundColor: 'transparent',
    color: '#fff',
    border: '2px solid #fff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  registerBtn: {
    padding: '0.6rem 1.75rem',
    backgroundColor: '#27ae60',
    color: '#fff',
    border: '2px solid #27ae60',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  logoutBtn: {
    padding: '0.6rem 1.75rem',
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: '2px solid #e74c3c',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
};

export default Navbar;