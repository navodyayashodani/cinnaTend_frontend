// src/pages/admin/AdminDashboard.jsx
// Route: /admin/dashboard

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats]                 = useState(null);
  const [recentUsers, setRecentUsers]     = useState([]);
  const [recentTenders, setRecentTenders] = useState([]);
  const [activityLogs, setActivityLogs]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, u, t, a] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getUsers({ limit: 5 }),
          adminAPI.getTenders({ limit: 5 }),
          adminAPI.getActivityLogs({ limit: 8 }),
        ]);
        setStats(s);
        setRecentUsers(Array.isArray(u)   ? u : (u.results || []));
        setRecentTenders(Array.isArray(t) ? t : (t.results || []));
        setActivityLogs(Array.isArray(a)  ? a : (a.results || []));
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data. Please check the backend.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <AdminLayout>
      <div style={s.center}>
        <div style={s.spinner} />
        <p style={{ color: '#64748b', marginTop: 12 }}>Loading dashboard…</p>
      </div>
    </AdminLayout>
  );

  if (error) return (
    <AdminLayout>
      <div style={s.center}>
        <div style={s.errorBox}>
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <p style={{ color: '#dc2626', fontWeight: 600, margin: '8px 0 0' }}>{error}</p>
          <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    </AdminLayout>
  );

  const statCards = [
    { label: 'Total Users',       value: stats?.total_users    ?? 0, icon: '👥', color: '#7c3aed', bg: '#f5f3ff', path: '/admin/users'           },
    { label: 'Total Tenders',     value: stats?.total_tenders  ?? 0, icon: '📋', color: '#d4922a', bg: '#fffbeb', path: '/admin/tenders'         },
    { label: 'Active Tenders',    value: stats?.active_tenders ?? 0, icon: '🟢', color: '#16a34a', bg: '#f0fdf4', path: '/admin/tenders'         },
    { label: 'Total Bids',        value: stats?.total_bids     ?? 0, icon: '💰', color: '#0284c7', bg: '#f0f9ff', path: '/admin/bids'            },
    { label: 'Inactive Users',    value: stats?.pending_users  ?? 0, icon: '⏳', color: '#dc2626', bg: '#fff1f2', path: '/admin/users'           },
    { label: 'Graded Reports',    value: stats?.graded_reports ?? 0, icon: '⭐', color: '#c2410c', bg: '#fff7ed', path: '/admin/grading-reports' },
  ];

  return (
    <AdminLayout>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Admin Dashboard</h1>
          <p style={s.subtitle}>Manage users, tenders, bids, and system activity</p>
        </div>
        <button style={s.reportBtn} onClick={() => navigate('/admin/reports')}>
          📊 Generate Report
        </button>
      </div>

      {/* Stat Cards */}
      <div style={s.statsGrid}>
        {statCards.map(card => (
          <div
            key={card.label}
            style={{ ...s.statCard, backgroundColor: card.bg, borderLeft: `4px solid ${card.color}` }}
            onClick={() => navigate(card.path)}
          >
            <div style={{ ...s.statIcon, color: card.color }}>{card.icon}</div>
            <div>
              <p style={{ ...s.statValue, color: card.color }}>{card.value}</p>
              <p style={s.statLabel}>{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div style={s.contentGrid}>

        {/* Recent Tenders */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>📋 Recent Tenders</span>
            <button style={s.viewAllBtn} onClick={() => navigate('/admin/tenders')}>View All</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                {['Title', 'Created By', 'Status', 'Bids', 'Deadline', 'Grade'].map(h =>
                  <th key={h} style={s.th}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {recentTenders.length === 0
                ? <tr><td colSpan={6} style={s.empty}>No tenders yet</td></tr>
                : recentTenders.map(t => (
                  <tr key={t.id} style={s.trHover} onClick={() => navigate('/admin/tenders')}>
                    <td style={s.td}>{t.title}</td>
                    <td style={s.td}>{t.created_by}</td>
                    <td style={s.td}>
                      {/* Use display_status array — shows multiple badges if needed */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(t.display_status || [t.status]).map(tag => (
                          <StatusBadge key={tag} status={tag} />
                        ))}
                      </div>
                    </td>
                    <td style={s.td}>{t.bid_count ?? 0}</td>
                    <td style={s.td}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                    <td style={s.td}><GradeBadge grade={t.quality_grade} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Recent Users */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>👥 Recent Users</span>
            <button style={s.viewAllBtn} onClick={() => navigate('/admin/users')}>View All</button>
          </div>
          <table style={s.table}>
            <thead>
              <tr>
                {['Name', 'Username', 'Role', 'Status', 'Joined'].map(h =>
                  <th key={h} style={s.th}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {recentUsers.length === 0
                ? <tr><td colSpan={5} style={s.empty}>No users yet</td></tr>
                : recentUsers.map(u => (
                  <tr key={u.id} style={s.trHover} onClick={() => navigate('/admin/users')}>
                    <td style={s.td}>{u.first_name} {u.last_name}</td>
                    <td style={s.td}>{u.username}</td>
                    <td style={s.td}><RoleBadge role={u.role} /></td>
                    <td style={s.td}>
                      <span style={u.is_active ? s.activePill : s.inactivePill}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={s.td}>{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

      </div>

      {/* Activity Log */}
      <div style={{ ...s.card, marginTop: '1.5rem' }}>
        <div style={s.cardHeader}>
          <span style={s.cardTitle}>📝 Recent Activity Log</span>
          <button style={s.viewAllBtn} onClick={() => navigate('/admin/activity-logs')}>View All</button>
        </div>
        <div style={s.logList}>
          {activityLogs.length === 0
            ? <p style={s.empty}>No activity recorded yet.</p>
            : activityLogs.map(log => (
              <div key={log.id} style={s.logRow}>
                <span style={s.logIcon}>{getLogIcon(log.action)}</span>
                <div style={{ flex: 1 }}>
                  <span style={s.logAction}>{log.action}</span>
                  {' '}
                  <span style={s.logDetail}>{log.detail}</span>
                </div>
                <div style={s.logMeta}>
                  <span style={s.logActor}>by {log.actor}</span>
                  <span style={s.logTime}>{formatTime(log.timestamp)}</span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ ...s.card, marginTop: '1.5rem' }}>
        <p style={s.qaTitle}>⚡ Quick Actions</p>
        <div style={s.qaGrid}>
          {[
            { label: 'Manage Users',    icon: '👥', path: '/admin/users'           },
            { label: 'Review Tenders',  icon: '📋', path: '/admin/tenders'         },
            { label: 'View Bids',       icon: '💰', path: '/admin/bids'            },
            { label: 'Grading Reports', icon: '⭐', path: '/admin/grading-reports' },
            { label: 'Activity Logs',   icon: '📝', path: '/admin/activity-logs'   },
            { label: 'System Reports',  icon: '📊', path: '/admin/reports'         },
          ].map(a => (
            <button
              key={a.path}
              style={s.qaBtn}
              onClick={() => navigate(a.path)}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#7c3aed'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span style={{ fontSize: '1.4rem' }}>{a.icon}</span>
              <span style={s.qaLabel}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

    </AdminLayout>
  );
}

// ── Badge components ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'active':   { bg: '#dcfce7', color: '#16a34a', label: 'Active'   },
    'closed':   { bg: '#fee2e2', color: '#dc2626', label: 'Closed'   },
    'awarded':  { bg: '#dbeafe', color: '#2563eb', label: 'Awarded'  },
    'no bids':  { bg: '#f1f5f9', color: '#64748b', label: 'No Bids'  },
    'pending':  { bg: '#fef9c3', color: '#ca8a04', label: 'Pending'  },
    'accepted': { bg: '#dbeafe', color: '#2563eb', label: 'Accepted' },
  };
  const c = map[status?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b', label: status || '—' };
  return (
    <span style={{ ...pill, backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>—</span>;
  const colors = { 'A+': '#15803d', A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#dc2626' };
  const color  = colors[grade?.toUpperCase()] || '#64748b';
  return <span style={{ ...pill, backgroundColor: color + '22', color }}>{grade}</span>;
}

function RoleBadge({ role }) {
  const map = {
    manufacturer: { bg: '#fef3c7', color: '#d97706' },
    buyer:        { bg: '#dbeafe', color: '#2563eb' },
    admin:        { bg: '#ede9fe', color: '#7c3aed' },
  };
  const c = map[role?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b' };
  return <span style={{ ...pill, backgroundColor: c.bg, color: c.color }}>{role || '—'}</span>;
}

function getLogIcon(action = '') {
  const a = action.toLowerCase();
  if (a.includes('login'))  return '🔑';
  if (a.includes('tender')) return '📋';
  if (a.includes('bid'))    return '💰';
  if (a.includes('grade'))  return '⭐';
  if (a.includes('user'))   return '👤';
  if (a.includes('report')) return '📊';
  if (a.includes('chat'))   return '💬';
  return '📌';
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Styles ────────────────────────────────────────────────────────────────────
const pill = {
  display: 'inline-block', borderRadius: 4,
  fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
};

const s = {
  center:    { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  spinner:   { width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #27ae60', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorBox:  { textAlign: 'center', background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  retryBtn:  { marginTop: 12, padding: '8px 20px', border: 'none', borderRadius: 6, backgroundColor: '#27ae60', color: '#fff', fontWeight: 600, cursor: 'pointer' },

  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' },
  title:     { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a2e44' },
  subtitle:  { margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' },
  reportBtn: { padding: '0.55rem 1.25rem', border: 'none', borderRadius: 8, backgroundColor: '#27ae60', color: '#fff', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },

  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.75rem' },
  statCard:    { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', borderRadius: 10, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'transform 0.15s' },
  statIcon:    { fontSize: '1.8rem' },
  statValue:   { margin: 0, fontSize: '1.6rem', fontWeight: 800 },
  statLabel:   { margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 },

  contentGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  cardHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
  cardTitle:   { fontWeight: 700, fontSize: '1rem', color: '#1a2e44' },
  viewAllBtn:  { padding: '4px 12px', border: '1px solid #e2e8f0', borderRadius: 6, backgroundColor: 'transparent', color: '#27ae60', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' },

  table:    { width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' },
  th:       { padding: '0.5rem 0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  td:       { padding: '0.65rem 0.75rem', color: '#374151', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  trHover:  { cursor: 'pointer' },
  empty:    { padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' },

  activePill:   { display: 'inline-block', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px' },
  inactivePill: { display: 'inline-block', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px' },

  logList:   { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  logRow:    { display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.55rem 0.5rem', borderBottom: '1px solid #f8fafc' },
  logIcon:   { fontSize: '1rem', marginTop: 2 },
  logAction: { fontWeight: 600, color: '#1a2e44', fontSize: '0.85rem' },
  logDetail: { color: '#64748b', fontSize: '0.85rem' },
  logMeta:   { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 },
  logActor:  { color: '#188b48ff', fontSize: '0.78rem', fontWeight: 600 },
  logTime:   { color: '#94a3b8', fontSize: '0.75rem' },

  qaTitle:   { margin: '0 0 1rem', fontWeight: 700, fontSize: '1rem', color: '#1a2e44' },
  qaGrid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' },
  qaBtn:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '1rem 0.75rem', border: '1px solid #e2e8f0', borderRadius: 10, backgroundColor: '#fafafa', cursor: 'pointer', transition: 'border-color 0.15s' },
  qaLabel:   { fontSize: '0.82rem', fontWeight: 600, color: '#374151', textAlign: 'center' },
};