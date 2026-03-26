// src/pages/admin/AdminGradingReports.jsx

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminGradingReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ✅ Track screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    adminAPI.getGradingReports({ limit: 200 })
      .then(data => setReports(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r => {
    const matchSearch = !search ||
      r.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      r.tender_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.tender_number?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = !filterGrade || r.grade === filterGrade;
    return matchSearch && matchGrade;
  });

  // Grade distribution counts
  const gradeCounts = ['A', 'B', 'C'].map(g => ({
    grade: g,
    count: reports.filter(r => r.grade === g).length,
  }));

  return (
    <AdminLayout>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Grading Reports</h1>
          <p style={s.subtitle}>ML-generated quality grades for all tenders</p>
        </div>
      </div>

      {/* Grade summary cards */}
      <div style={s.gradeCards}>
        {gradeCounts.map(({ grade, count }) => (
          <div key={grade} style={{ ...s.gradeCard, borderTop: `3px solid ${gradeColor(grade)}` }}
            onClick={() => setFilterGrade(filterGrade === grade ? '' : grade)}>
            <span style={{ ...s.gradeBig, color: gradeColor(grade) }}>{grade}</span>
            <span style={s.gradeCount}>{count} tenders</span>
          </div>
        ))}
      </div>

      <div style={s.toolbar}>
        <input 
          style={s.search} 
          placeholder="🔍  Search reports…" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <select style={s.select} value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
          <option value="">All Grades</option>
          {['A', 'B', 'C'].map(g => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <span style={s.count}>{filtered.length} reports</span>
      </div>

      <div style={s.card}>
        {loading ? <p style={s.empty}>Loading…</p> : (
          isMobile ? (
            // ✅ MOBILE: Card view
            <div style={s.mobileList}>
              {filtered.length === 0 ? (
                <p style={s.empty}>No graded tenders found</p>
              ) : (
                filtered.map(r => (
                  <div key={r.id} style={s.mobileCard}>
                    <div style={s.mobileHeader}>
                      <span style={s.tnumber}>{r.tender_number}</span>
                      <GradeBadge grade={r.grade} />
                    </div>
                    <h4 style={s.mobileTitle}>{r.tender_title}</h4>
                    <div style={s.mobileGrid}>
                      <div style={s.mobileField}>
                        <span style={s.mobileLabel}>Manufacturer</span>
                        <span style={s.mobileValue}>{r.manufacturer}</span>
                      </div>
                      <div style={s.mobileField}>
                        <span style={s.mobileLabel}>Oil Type</span>
                        <span style={s.mobileValue}>{r.oil_type || '—'}</span>
                      </div>
                      <div style={s.mobileField}>
                        <span style={s.mobileLabel}>Score</span>
                        <span style={{ ...s.mobileValue, fontWeight: 700, color: gradeColor(r.grade) }}>
                          {r.score || '—'}
                        </span>
                      </div>
                      <div style={s.mobileField}>
                        <span style={s.mobileLabel}>Graded On</span>
                        <span style={s.mobileValue}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // ✅ DESKTOP: Table view
            <div style={s.tableWrapper}>
              <table style={s.table}>
                <thead>
                  <tr>{['Tender #', 'Tender Title', 'Manufacturer', 'Oil Type', 'Grade', 'Score', 'Graded On'].map(h =>
                    <th key={h} style={s.th}>{h}</th>
                  )}</tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan={7} style={s.empty}>No graded tenders found</td></tr>
                    : filtered.map(r => (
                      <tr key={r.id} style={s.tr}>
                        <td style={s.td}><span style={s.tnumber}>{r.tender_number}</span></td>
                        <td style={s.td}><strong>{r.tender_title}</strong></td>
                        <td style={s.td}>{r.manufacturer}</td>
                        <td style={s.td}>{r.oil_type || '—'}</td>
                        <td style={s.td}><GradeBadge grade={r.grade} /></td>
                        <td style={s.td}>{r.score ? <span style={{ fontWeight: 700, color: gradeColor(r.grade) }}>{r.score}</span> : '—'}</td>
                        <td style={s.td}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
}

function gradeColor(grade) {
  const map = { 'A+': '#15803d', A: '#16a34a', B: '#2563eb', C: '#ca8a04', D: '#dc2626' };
  return map[grade] || '#64748b';
}

function GradeBadge({ grade }) {
  if (!grade) return <span style={{ color: '#94a3b8' }}>—</span>;
  const color = gradeColor(grade);
  return <span style={{ display: 'inline-block', borderRadius: 4, fontSize: '0.82rem', fontWeight: 700, padding: '3px 10px', backgroundColor: color + '22', color }}>{grade}</span>;
}

const s = {
  header:     { display: 'flex', marginBottom: '1.5rem' },
  title:      { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#1a2e44' },
  subtitle:   { margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b' },
  gradeCards: { display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  gradeCard:  { flex: 1, minWidth: 90, backgroundColor: '#fff', borderRadius: 10, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } },
  gradeBig:   { fontSize: '1.6rem', fontWeight: 800 },
  gradeCount: { fontSize: '0.78rem', color: '#64748b' },
  toolbar:    { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  search:     { flex: 1, minWidth: 200, padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  select:     { padding: '0.65rem 1rem', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', backgroundColor: '#fff' },
  count:      { color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  
  // Desktop table
  tableWrapper: { overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 900 },
  th:         { padding: '0.6rem 0.75rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9', whiteSpace: 'nowrap' },
  td:         { padding: '0.75rem', color: '#374151', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' },
  tr:         {},
  empty:      { padding: '2rem', textAlign: 'center', color: '#94a3b8' },
  tnumber:    { fontFamily: 'monospace', fontSize: '0.8rem', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4, color: '#475569' },

  // Mobile card view
  mobileList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  mobileCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: '1rem', border: '1px solid #e2e8f0' },
  mobileHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  mobileTitle: { margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#1a2e44' },
  mobileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  mobileField: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  mobileLabel: { fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' },
  mobileValue: { fontSize: '0.85rem', fontWeight: 500, color: '#374151' },
};