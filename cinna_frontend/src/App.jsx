// src/App.jsx

import React, { useState } from 'react';
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

// Admin pages
import AdminDashboard      from './pages/admin/AdminDashboard';
import AdminUsers          from './pages/admin/AdminUsers';
import AdminTenders        from './pages/admin/AdminTenders';
import AdminBids           from './pages/admin/AdminBids';
import AdminGradingReports from './pages/admin/AdminGradingReports';
import AdminActivityLogs   from './pages/admin/AdminActivityLogs';
import AdminReports        from './pages/admin/AdminReports';

// Profile page (shared)
import ProfilePage from './pages/ProfilePage';

import { useAuth } from './context/AuthContext';
import './App.css';

const HIDE_NAVBAR_PREFIXES = [
  '/manufacturer',
  '/buyer-dashboard',
  '/buyer/',
  '/profile',
  '/admin',
];

export function isAdmin(user) {
  if (!user) return false;
  return user.role === 'admin' || user.is_staff === true || user.is_superuser === true;
}

export function getDashboardPath(user) {
  if (!user) return '/';
  if (isAdmin(user))               return '/admin/dashboard';
  if (user.role === 'manufacturer') return '/manufacturer/dashboard';
  return '/buyer-dashboard';
}

function ProtectedRoute({ children, allowedRole }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!allowedRole) return children;
  if (allowedRole === 'admin' && isAdmin(user)) return children;
  if (user?.role === allowedRole) return children;

  return <Navigate to={getDashboardPath(user)} replace />;
}

function AppContent({ showLogin, setShowLogin, showRegister, setShowRegister }) {
  const location   = useLocation();
  const hideNavbar = HIDE_NAVBAR_PREFIXES.some(p => location.pathname.startsWith(p));

  const handleOpenLogin    = () => { setShowRegister(false); setShowLogin(true); };
  const handleOpenRegister = () => { setShowLogin(false); setShowRegister(true); };

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
        <Route path="/manufacturer-dashboard" element={<Navigate to="/manufacturer/dashboard" replace />}/>

        {/* ── Buyer ── */}
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute allowedRole="buyer"><BuyerDashboardPage /></ProtectedRoute>
        }/>
        <Route path="/buyer/my-bids" element={
          <ProtectedRoute allowedRole="buyer"><BuyerMyBidsPage /></ProtectedRoute>
        }/>

        {/* ── Admin ── */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
        }/>
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>
        }/>
        <Route path="/admin/tenders" element={
          <ProtectedRoute allowedRole="admin"><AdminTenders /></ProtectedRoute>
        }/>
        <Route path="/admin/bids" element={
          <ProtectedRoute allowedRole="admin"><AdminBids /></ProtectedRoute>
        }/>
        <Route path="/admin/grading-reports" element={
          <ProtectedRoute allowedRole="admin"><AdminGradingReports /></ProtectedRoute>
        }/>
        <Route path="/admin/activity-logs" element={
          <ProtectedRoute allowedRole="admin"><AdminActivityLogs /></ProtectedRoute>
        }/>
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>
        }/>

        {/* ── Profile (all roles) ── */}
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