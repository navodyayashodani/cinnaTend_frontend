// src/pages/admin/AdminTenders.jsx

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminTenders() {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    adminAPI.getTenders({ limit: 200 })
      .then(data => setTenders(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = tenders.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.tender_number?.toLowerCase().includes(search.toLowerCase()) ||
      t.created_by?.toLowerCase().includes(search.toLowerCase());

    // Filter by any tag in display_status array
    const matchStatus = !filterStatus ||
      (t.display_status && t.display_status.includes(filterStatus));

    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Tender Overview</h1>
          <p style={s.subtitle}>All tenders across the platform</p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={s.toolbar}>
        <input
          style={s.search}
          placeholder="🔍  Search by title, number or manufacturer…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="awarded">Awarded</option>
          <option value="no bids">No Bids</option>
        </select>
        <span style={s.count}>{filtered.length} tenders</span>
      </div>

      <div style={s.card}>
        {loading ? <p style={s.empty}>Loading…</p> : (
          <table style={s.table}>
            <thead>
              <tr>
                {['#', 'Title', 'Manufacturer', 'Oil Type', 'Qty', 'Status', 'Bids', 'Grade', 'Deadline'].map(h =>
                  <th key={h} style={s.th}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={9} style={s.empty}>No tenders found</td></tr>
                : filtered.map(t => (
                  <tr key={t.id} style={s.tr}>
                    <td style={s.td}><span style={s.tnumber}>{t.tender_number}</span></td>
                    <td style={s.td}><strong>{t.title}</strong></td>
                    <td style={s.td}>{t.created_by}</td>
                    <td style={s.td}><OilBadge type={t.oil_type} /></td>
                    <td style={s.td}>{t.quantity}</td>
                    <td style={s.td}>
                      {/* Render every tag in display_status array */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(t.display_status || [t.status]).map(tag => (
                          <StatusBadge key={tag} status={tag} />
                        ))}
                      </div>
                    </td>
                    <td style={{ ...s.td, textAlign: 'center' }}>{t.bid_count ?? 0}</td>
                    <td style={s.td}><GradeBadge grade={t.quality_grade} /></td>
                    <td style={s.td}>{t.deadline ? new Date(t.deadline).toLocaleDateString() : '—'}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

// ── Badge components ───────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    'active':   { bg: '#dcfce7', color: '#16a34a', label: 'Active'   },
    'closed':   { bg: '#fee2e2', color: '#dc2626', label: 'Closed'   },
    'awarded':  { bg: '#dbeafe', color: '#2563eb', label: 'Awarded'  },
    'no bids':  { bg: '#f1f5f9', color: '#64748b', label: 'No Bids'  },
  };
  const c = map[status] || { bg: '#f1f5f9', color: '#64748b', label: status };
  return (
    <span style={{
      display: 'inline-block', borderRadius: 4,
      fontSize: '0.72rem', fontWeight: 700,
      padding: '2px 8px', whiteSpace: 'nowrap',
      backgroundColor: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  );
}

function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color: '#94a3b8' }}>—</span>;
  const colors = { 'A+': '#15803d', A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#dc2626' };
  const color  = colors[grade] || '#64748b';
  return (
    <span style={{
      display: 'inline-block', borderRadius: 4,
      fontSize: '0.75rem', fontWeight: 700,
      padding: '2px 8px', backgroundColor: color + '22', color,
    }}>
      {grade}
    </span>
  );
}

function OilBadge({ type }) {
  const labels = { crude: 'Crude', refined: 'Refined', organic: 'Organic', conventional: 'Conventional' };
  return <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{labels[type] || type || '—'}</span>;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  header:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' },
  title:    { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a2e44' },
  subtitle: { margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' },
  toolbar:  { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  search:   { flex: 1, minWidth: 200, padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  select:   { padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' },
  count:    { color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  card:     { backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflowX: 'auto' },
  table:    { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th:       { padding: '0.6rem 0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', whiteSpace: 'nowrap' },
  td:       { padding: '0.75rem', color: '#374151', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tr:       {},
  empty:    { padding: '2rem', textAlign: 'center', color: '#94a3b8' },
  tnumber:  { fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569' },
};