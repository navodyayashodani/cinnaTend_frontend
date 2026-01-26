// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';
import ManufacturerDashboard from './components/ManufacturerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import { getUser } from './services/api';
import './App.css';

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const loggedUser = getUser();
    setUser(loggedUser);
    setLoading(false);
  }, []);

  // Listen for storage changes (in case user logs in from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const loggedUser = getUser();
      setUser(loggedUser);
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Functions to switch between modals
  const handleOpenLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleOpenRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const handleCloseRegister = () => {
    setShowRegister(false);
  };

  const handleLogout = () => {
    setUser(null);
    // Optionally clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
  };



  // Protected Route Component
  const ProtectedRoute = ({ children, allowedRole }) => {
    const currentUser = getUser();

    if (loading) {
      return (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (!currentUser) {
      // Not logged in, redirect to home
      return <Navigate to="/" replace />;
    }
    
    if (allowedRole && currentUser.role !== allowedRole) {
      // Wrong role, redirect to correct dashboard
      return currentUser.role === 'manufacturer' 
        ? <Navigate to="/manufacturer-dashboard" replace />
        : <Navigate to="/buyer-dashboard" replace />;
    }
    
    return children;
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar 
          user={user}
          onLoginClick={handleOpenLogin}
          onRegisterClick={handleOpenRegister}
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route 
            path="/" 
            element={<Home onRegisterClick={handleOpenRegister} />} 
          />
          
          <Route 
            path="/manufacturer-dashboard" 
            element={
              <ProtectedRoute allowedRole="manufacturer">
                <ManufacturerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/buyer-dashboard" 
            element={
              <ProtectedRoute allowedRole="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Login Modal with switch to register functionality */}
        <LoginModal 
          isOpen={showLogin} 
          onClose={handleCloseLogin}
          onSwitchToRegister={handleOpenRegister}
          onLoginSuccess={handleLoginSuccess}
        />
        
        {/* Register Modal with switch to login functionality */}
        <RegisterModal 
          isOpen={showRegister} 
          onClose={handleCloseRegister}
          onSwitchToLogin={handleOpenLogin}
          onRegisterSuccess={handleRegisterSuccess}
        />
      </div>
    </Router>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    gap: '1rem',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #e0e0e0',
    borderTop: '4px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default App;