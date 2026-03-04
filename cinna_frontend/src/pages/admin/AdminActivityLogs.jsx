// src/pages/admin/AdminActivityLogs.jsx

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminActivityLogs() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    adminAPI.getActivityLogs({ limit: 100 })
      .then(data => setLogs(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.actor?.toLowerCase().includes(search.toLowerCase()) ||
      l.detail?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase());
    const matchAction = !filterAction || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const uniqueActions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  return (
    <AdminLayout>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Activity Logs</h1>
          <p style={s.subtitle}>Full audit trail of all system activity</p>
        </div>
      </div>

      <div style={s.toolbar}>
        <input style={s.search} placeholder="🔍  Search by actor or detail…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <span style={s.count}>{filtered.length} entries</span>
      </div>

      <div style={s.card}>
        {loading ? <p style={s.empty}>Loading…</p> : filtered.length === 0 ? <p style={s.empty}>No activity found</p> : (
          <div style={s.logList}>
            {filtered.map(log => (
              <div key={log.id} style={s.logRow}>
                <div style={s.logIconWrap}>{getLogIcon(log.action)}</div>
                <div style={{ flex: 1 }}>
                  <div style={s.logTop}>
                    <span style={s.logAction}>{log.action}</span>
                    <span style={s.logDetail}>{log.detail}</span>
                  </div>
                  <div style={s.logBottom}>
                    <span style={s.logActor}>👤 {log.actor}</span>
                    <span style={s.logTime}>{formatTime(log.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function getLogIcon(action = '') {
  const a = action.toLowerCase();
  if (a.includes('tender'))  return '📋';
  if (a.includes('bid'))     return '💰';
  if (a.includes('grade'))   return '⭐';
  if (a.includes('login'))   return '🔑';
  if (a.includes('user'))    return '👤';
  if (a.includes('report'))  return '📊';
  return '📌';
}

function formatTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

const s = {
  header:     { display: 'flex', marginBottom: '1.5rem' },
  title:      { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a2e44' },
  subtitle:   { margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' },
  toolbar:    { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  search:     { flex: 1, minWidth: 200, padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  select:     { padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' },
  count:      { color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  logList:    { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  logRow:     { display: 'flex', gap: '1rem', padding: '0.75rem', borderRadius: 8, border: '1px solid #f1f5f9', alignItems: 'flex-start' },
  logIconWrap:{ fontSize: '1.3rem', marginTop: 2 },
  logTop:     { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  logAction:  { fontWeight: 700, color: '#1a2e44', fontSize: '0.88rem' },
  logDetail:  { color: '#64748b', fontSize: '0.85rem' },
  logBottom:  { display: 'flex', gap: '1rem', marginTop: 4 },
  logActor:   { color: '#188b48ff', fontSize: '0.8rem', fontWeight: 600 },
  logTime:    { color: '#94a3b8', fontSize: '0.8rem' },
  empty:      { padding: '2rem', textAlign: 'center', color: '#94a3b8' },
};