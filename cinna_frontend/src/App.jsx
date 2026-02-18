// src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import LoginModal from './components/LoginModal';
import RegisterModal from './components/RegisterModal';

// Manufacturer pages
import DashboardPage      from './pages/manufacturer/DashboardPage';
import MyTendersPage      from './pages/manufacturer/MyTendersPage';
import CreateTenderPage   from './pages/manufacturer/CreateTenderPage';
import QualityGradingPage from './pages/manufacturer/QualityGradingPage';
import AnalyticsPage      from './pages/manufacturer/AnalyticsPage';

// Buyer pages
import BuyerDashboardPage from './pages/buyer/BuyerDashboardPage';
import BuyerMyBidsPage    from './pages/buyer/BuyerMyBidsPage';

// Profile page (shared)
import ProfilePage from './pages/ProfilePage';

import { useAuth } from './context/AuthContext';
import './App.css';

// Routes where the global Navbar is hidden (they have their own navbar + sidebar)
const HIDE_NAVBAR_PREFIXES = ['/manufacturer', '/buyer-dashboard', '/buyer/', '/profile'];

function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (allowedRole && user?.role !== allowedRole) {
    return user?.role === 'manufacturer'
      ? <Navigate to="/manufacturer/dashboard" replace />
      : <Navigate to="/buyer-dashboard" replace />;
  }

  return children;
}

function AppContent({ showLogin, setShowLogin, showRegister, setShowRegister }) {
  const location   = useLocation();
  const hideNavbar = HIDE_NAVBAR_PREFIXES.some(p => location.pathname.startsWith(p));

  const handleOpenLogin       = () => { setShowRegister(false); setShowLogin(true); };
  const handleOpenRegister    = () => { setShowLogin(false); setShowRegister(true); };

  return (
    <div className="App">
      {!hideNavbar && (
        <Navbar onLoginClick={handleOpenLogin} onRegisterClick={handleOpenRegister} />
      )}

      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<Home onRegisterClick={handleOpenRegister} />} />

        {/* ── Manufacturer ── */}
        <Route path="/manufacturer/dashboard" element={
          <ProtectedRoute allowedRole="manufacturer"><DashboardPage /></ProtectedRoute>
        }/>
        <Route path="/manufacturer/my-tenders" element={
          <ProtectedRoute allowedRole="manufacturer"><MyTendersPage /></ProtectedRoute>
        }/>
        <Route path="/manufacturer/create-tender" element={
          <ProtectedRoute allowedRole="manufacturer"><CreateTenderPage /></ProtectedRoute>
        }/>
        <Route path="/manufacturer/quality-grading" element={
          <ProtectedRoute allowedRole="manufacturer"><QualityGradingPage /></ProtectedRoute>
        }/>
        <Route path="/manufacturer/analytics" element={
          <ProtectedRoute allowedRole="manufacturer"><AnalyticsPage /></ProtectedRoute>
        }/>
        {/* Redirect old route */}
        <Route path="/manufacturer-dashboard" element={<Navigate to="/manufacturer/dashboard" replace />}/>

        {/* ── Buyer ── */}
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute allowedRole="buyer"><BuyerDashboardPage /></ProtectedRoute>
        }/>
        <Route path="/buyer/my-bids" element={
          <ProtectedRoute allowedRole="buyer"><BuyerMyBidsPage /></ProtectedRoute>
        }/>

        {/* ── Profile (both roles) ── */}
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        }/>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />}/>
      </Routes>

      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={handleOpenRegister}
      />
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={handleOpenLogin}
      />
    </div>
  );
}

export default function App() {
  const [showLogin,    setShowLogin]    = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <Router>
      <AppContent
        showLogin={showLogin}       setShowLogin={setShowLogin}
        showRegister={showRegister} setShowRegister={setShowRegister}
      />
    </Router>
  );
}

const st = {
  loadingContainer: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f5f6fa', gap: '1rem' },
  spinner: { width: 50, height: 50, border: '4px solid #e0e0e0', borderTop: '4px solid #d4922a', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};