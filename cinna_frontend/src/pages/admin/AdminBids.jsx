// src/pages/admin/AdminBids.jsx

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminBids() {
  const [bids, setBids]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    adminAPI.getBids({ limit: 200 })
      .then(data => setBids(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = bids.filter(b => {
    const matchSearch = !search ||
      b.buyer?.toLowerCase().includes(search.toLowerCase()) ||
      b.tender_title?.toLowerCase().includes(search.toLowerCase()) ||
      b.tender_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <AdminLayout>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Bid Management</h1>
          <p style={s.subtitle}>All bids submitted across the platform</p>
        </div>
      </div>

      <div style={s.toolbar}>
        <input style={s.search} placeholder="🔍  Search by buyer, tender title or number…" value={search} onChange={e => setSearch(e.target.value)} />
        <select style={s.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
        <span style={s.count}>{filtered.length} bids</span>
      </div>

      <div style={s.card}>
        {loading ? <p style={s.empty}>Loading…</p> : (
          <table style={s.table}>
            <thead>
              <tr>{['Tender #', 'Tender Title', 'Buyer', 'Bid Amount', 'Message', 'Status', 'Submitted'].map(h =>
                <th key={h} style={s.th}>{h}</th>
              )}</tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={7} style={s.empty}>No bids found</td></tr>
                : filtered.map(b => (
                  <tr key={b.id} style={s.tr}>
                    <td style={s.td}><span style={s.tnumber}>{b.tender_number}</span></td>
                    <td style={s.td}>{b.tender_title}</td>
                    <td style={s.td}><strong>{b.buyer}</strong></td>
                    <td style={s.td}><span style={s.amount}>LKR {Number(b.bid_amount).toLocaleString()}</span></td>
                    <td style={s.td}><span style={s.msg}>{b.message || '—'}</span></td>
                    <td style={s.td}><BidStatusBadge status={b.status} /></td>
                    <td style={s.td}>{b.created_at ? new Date(b.created_at).toLocaleDateString() : '—'}</td>
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

function BidStatusBadge({ status }) {
  const map = { pending: { bg: '#fef9c3', color: '#ca8a04' }, accepted: { bg: '#dcfce7', color: '#16a34a' }, rejected: { bg: '#fee2e2', color: '#dc2626' } };
  const c = map[status?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b' };
  return <span style={{ display: 'inline-block', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', backgroundColor: c.bg, color: c.color, textTransform: 'capitalize' }}>{status || '—'}</span>;
}

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
  amount:   { fontWeight: 700, color: '#16a34a' },
  msg:      { color: '#64748b', fontSize: '0.82rem', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};