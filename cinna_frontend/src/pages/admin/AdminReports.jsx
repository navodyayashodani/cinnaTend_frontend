// src/pages/admin/AdminReports.jsx

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminReports() {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    adminAPI.getSummaryReport()
      .then(data => setReport(data))
      .catch(() => setError('Failed to load report data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><p style={s.empty}>Loading report…</p></AdminLayout>;
  if (error)   return <AdminLayout><p style={{ ...s.empty, color: '#dc2626' }}>{error}</p></AdminLayout>;

  const oilColors = {
    crude:        '#d97706',
    refined:      '#0284c7',
    organic:      '#16a34a',
    conventional: '#7c3aed',
  };

  // Computed status breakdown from backend
  const statusBreakdown = [
    { key: 'active',   label: 'Active',    color: '#16a34a', count: report.status_active   ?? 0 },
    { key: 'closed',   label: 'Closed',    color: '#dc2626', count: report.status_closed   ?? 0 },
    { key: 'awarded',  label: 'Awarded',   color: '#2563eb', count: report.status_awarded  ?? 0 },
    { key: 'no_bids',  label: 'No Bids',   color: '#94a3b8', count: report.status_no_bids  ?? 0 },
  ];
  const statusTotal = statusBreakdown.reduce((sum, r) => sum + r.count, 0) || 1;

  return (
    <AdminLayout>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>System Reports</h1>
          <p style={s.subtitle}>
            Generated: {report.generated_at ? new Date(report.generated_at).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      {/* Top stats */}
      <div style={s.statsRow}>
        {[
          { label: 'Total Users',    value: report.total_users,    icon: '👥', color: '#7c3aed' },
          { label: 'Total Tenders',  value: report.total_tenders,  icon: '📋', color: '#d4922a' },
          { label: 'Total Bids',     value: report.total_bids,     icon: '💰', color: '#0284c7' },
          { label: 'Graded Reports', value: report.graded_reports, icon: '⭐', color: '#16a34a' },
        ].map(c => (
          <div key={c.label} style={{ ...s.statCard, borderLeft: `4px solid ${c.color}` }}>
            <span style={{ fontSize: '1.6rem' }}>{c.icon}</span>
            <div>
              <p style={{ ...s.statValue, color: c.color }}>{c.value ?? 0}</p>
              <p style={s.statLabel}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={s.grid}>

        {/* Tender by computed status */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>📋 Tenders by Status</h3>
          {statusBreakdown.map(row => {
            const pct = Math.round((row.count / statusTotal) * 100);
            return (
              <div key={row.key} style={s.barRow}>
                <span style={s.barLabel}>{row.label}</span>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${pct}%`, backgroundColor: row.color }} />
                </div>
                <span style={s.barCount}>{row.count}</span>
              </div>
            );
          })}
        </div>

        {/* Tender by oil type */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>🌿 Tenders by Oil Type</h3>
          {(report.tender_by_oil_type || []).length === 0
            ? <p style={s.empty}>No data</p>
            : (report.tender_by_oil_type || []).map(row => {
                const total  = report.total_tenders || 1;
                const pct    = Math.round((row.count / total) * 100);
                const color  = oilColors[row.oil_type] || '#94a3b8';
                const labels = { crude: 'Crude', refined: 'Refined', organic: 'Organic', conventional: 'Conventional' };
                return (
                  <div key={row.oil_type} style={s.barRow}>
                    <span style={s.barLabel}>{labels[row.oil_type] || row.oil_type}</span>
                    <div style={s.barTrack}>
                      <div style={{ ...s.barFill, width: `${pct}%`, backgroundColor: color }} />
                    </div>
                    <span style={s.barCount}>{row.count}</span>
                  </div>
                );
              })
          }
        </div>

        {/* Top bidders */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>💰 Top Bidders</h3>
          {(report.top_bidders || []).length === 0
            ? <p style={s.empty}>No bids yet</p>
            : (report.top_bidders || []).map((b, i) => (
              <div key={b.buyer__username} style={s.rankRow}>
                <span style={{ ...s.rank, backgroundColor: i === 0 ? '#fef3c7' : '#f1f5f9', color: i === 0 ? '#d97706' : '#64748b' }}>
                  #{i + 1}
                </span>
                <span style={s.rankName}>{b.buyer__username}</span>
                <span style={s.rankCount}>{b.total_bids} bids</span>
              </div>
            ))
          }
        </div>

        {/* Top manufacturers */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>🏭 Top Manufacturers</h3>
          {(report.top_manufacturers || []).length === 0
            ? <p style={s.empty}>No tenders yet</p>
            : (report.top_manufacturers || []).map((m, i) => (
              <div key={m.manufacturer__username} style={s.rankRow}>
                <span style={{ ...s.rank, backgroundColor: i === 0 ? '#fef3c7' : '#f1f5f9', color: i === 0 ? '#d97706' : '#64748b' }}>
                  #{i + 1}
                </span>
                <span style={s.rankName}>{m.manufacturer__username}</span>
                <span style={s.rankCount}>{m.total_tenders} tenders</span>
              </div>
            ))
          }
        </div>

      </div>
    </AdminLayout>
  );
}

const s = {
  header:    { display: 'flex', marginBottom: '1.5rem' },
  title:     { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a2e44' },
  subtitle:  { margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' },
  statsRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard:  { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statValue: { margin: 0, fontSize: '1.5rem', fontWeight: 800 },
  statLabel: { margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' },
  grid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px,1fr))', gap: '1.25rem' },
  card:      { backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  cardTitle: { margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: '#1a2e44' },
  barRow:    { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' },
  barLabel:  { width: 100, fontSize: '0.82rem', color: '#374151', flexShrink: 0 },
  barTrack:  { flex: 1, height: 10, backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 99, transition: 'width 0.4s' },
  barCount:  { width: 30, fontSize: '0.82rem', color: '#64748b', textAlign: 'right' },
  rankRow:   { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f8fafc' },
  rank:      { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 },
  rankName:  { flex: 1, fontSize: '0.88rem', fontWeight: 600, color: '#374151' },
  rankCount: { fontSize: '0.82rem', color: '#64748b' },
  empty:     { padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' },
};