// src/pages/buyer/BuyerMyBidsPage.jsx  — MOBILE RESPONSIVE FIXED

import React, { useState, useEffect } from 'react';
import { bidAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BuyerLayout from '../../components/BuyerLayout';

const statusColor  = (s) => ({ pending: '#d97706', accepted: '#16a34a', rejected: '#dc2626' }[s] || '#64748b');
const statusBg     = (s) => ({ pending: '#fffbeb', accepted: '#f0fdf4', rejected: '#fef2f2' }[s] || '#f8fafc');
const statusBorder = (s) => ({ pending: '#fde68a', accepted: '#86efac', rejected: '#fca5a5' }[s] || '#e2e8f0');

export default function BuyerMyBidsPage() {
  const { user } = useAuth();
  const [myBids,  setMyBids]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchBids(); }, []);

  const fetchBids = async () => {
    setLoading(true);
    try {
      const r = await bidAPI.getAllBids();
      setMyBids(r.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? myBids : myBids.filter(b => b.status === filter);
  const counts = {
    all:      myBids.length,
    pending:  myBids.filter(b => b.status === 'pending').length,
    accepted: myBids.filter(b => b.status === 'accepted').length,
    rejected: myBids.filter(b => b.status === 'rejected').length,
  };

  return (
    <BuyerLayout>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>My Bids</h2>
          <p style={s.pageSubtitle}>Track all your submitted bids and their status</p>
        </div>
      </div>

      {/* Stat cards — 2 cols mobile, 4 cols desktop */}
      <div style={{ ...s.statsRow, gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
        {[
          { icon: '📋', label: 'Total Bids',  val: counts.all,      sub: 'All time',          gold: false },
          { icon: '⏳', label: 'Pending',      val: counts.pending,  sub: 'Awaiting decision', gold: true  },
          { icon: '🏆', label: 'Accepted',     val: counts.accepted, sub: 'Won tenders',       gold: false },
          { icon: '❌', label: 'Rejected',     val: counts.rejected, sub: 'Not selected',      gold: false },
        ].map(c => (
          <div key={c.label} style={{ ...s.statCard, ...(c.gold ? s.statCardGold : {}) }}>
            <div style={s.statIcon}>{c.icon}</div>
            <p style={{ ...s.statLbl, ...(!c.gold ? { color: '#64748b' } : {}) }}>{c.label}</p>
            <p style={{ ...s.statVal, ...(!c.gold ? { color: '#1a2e44' } : {}) }}>{c.val}</p>
            <p style={{ ...s.statSub, ...(c.gold ? { color: 'rgba(255,255,255,0.7)' } : {}) }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div style={{ ...s.filterRow, flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={s.sectionLabel}>Bid History</span>
        <div style={{ ...s.filters, flexWrap: 'wrap' }}>
          {['all', 'pending', 'accepted', 'rejected'].map(f => (
            <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {/* Bids list */}
      {loading ? (
        <div style={s.empty}><p style={s.emptyTxt}>Loading bids…</p></div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>
          <p style={s.emptyIcon}>💰</p>
          <p style={s.emptyTxt}>No bids found. Go to the Dashboard to browse and bid on tenders!</p>
        </div>
      ) : (
        <div style={s.bidsList}>
          {filtered.map(bid => (
            <div key={bid.id} style={{ ...s.bidCard, backgroundColor: statusBg(bid.status), border: `2px solid ${statusBorder(bid.status)}` }}>
              {/* Card header */}
              <div style={s.bidCardHead}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={s.bidTitle}>{bid.tender_details?.tender_title || 'Tender'}</h3>
                  <span style={s.bidTenderNum}>{bid.tender_details?.tender_number}</span>
                </div>
                <span style={{ ...s.statusBadge, backgroundColor: statusColor(bid.status), flexShrink: 0, marginLeft: '0.5rem' }}>
                  {bid.status === 'accepted' ? '🏆 ' : bid.status === 'rejected' ? '❌ ' : '⏳ '}
                  {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                </span>
              </div>

              {/* Card body */}
              <div style={s.bidCardBody}>
                <div style={{ ...s.infoGrid, gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill, minmax(180px,1fr))' }}>
                  {[
                    ['Your Bid', `$${parseFloat(bid.bid_amount).toLocaleString()}`, true],
                    ['Tender Status', bid.tender_details?.status || '—', false],
                    ['Submitted', new Date(bid.created_at).toLocaleDateString(), false],
                    ...(bid.updated_at !== bid.created_at
                      ? [['Last Updated', new Date(bid.updated_at).toLocaleDateString(), false]]
                      : []),
                  ].map(([label, val, highlight]) => (
                    <div key={label} style={s.infoItem}>
                      <span style={s.infoLbl}>{label}</span>
                      <span style={{ ...s.infoVal, ...(highlight ? { color: '#d4922a', fontSize: '1.1rem', fontWeight: 700 } : {}) }}>{val}</span>
                    </div>
                  ))}
                </div>

                {bid.message && (
                  <div style={s.messageBox}>
                    <span style={s.messageLbl}>Your Message</span>
                    <p style={s.messageText}>{bid.message}</p>
                  </div>
                )}
              </div>

              {bid.status === 'accepted' && (
                <div style={s.bannerAccepted}>
                  🎉 Congratulations! Your bid was accepted. The manufacturer will contact you shortly.
                </div>
              )}
              {bid.status === 'rejected' && (
                <div style={s.bannerRejected}>Another bid was selected for this tender.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </BuyerLayout>
  );
}

const s = {
  pageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle:     { margin: '0 0 0.3rem', color: '#1a2e44', fontSize: '1.4rem', fontWeight: 700 },
  pageSubtitle:  { margin: 0, color: '#64748b', fontSize: '0.9rem' },

  statsRow:      { display: 'grid', gap: '1rem', marginBottom: '1.75rem' },
  statCard:      { backgroundColor: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  statCardGold:  { backgroundColor: '#118341ff', border: '1.5px solid #118341ff' },
  statIcon:      { fontSize: '1.5rem', marginBottom: '0.3rem' },
  statLbl:       { margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  statVal:       { margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 },
  statSub:       { margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#94a3b8' },

  filterRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  sectionLabel:  { fontSize: '0.875rem', fontWeight: 700, color: '#1a2e44' },
  filters:       { display: 'flex', gap: '0.5rem' },
  filterBtn:     { padding: '0.35rem 0.7rem', border: '1.5px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 },
  filterActive:  { backgroundColor: '#1a2e44', color: '#fff', borderColor: '#1a2e44' },

  empty:         { textAlign: 'center', padding: '4rem', backgroundColor: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0' },
  emptyIcon:     { fontSize: '3rem', margin: '0 0 1rem' },
  emptyTxt:      { color: '#94a3b8', fontSize: '0.95rem', margin: 0 },

  bidsList:      { display: 'flex', flexDirection: 'column', gap: '1rem' },
  bidCard:       { borderRadius: 10, overflow: 'hidden' },
  bidCardHead:   { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1rem 1.2rem', borderBottom: '1px solid rgba(0,0,0,0.06)' },
  bidTitle:      { margin: '0 0 0.2rem', color: '#1a2e44', fontSize: '0.95rem', fontWeight: 700 },
  bidTenderNum:  { fontSize: '0.75rem', color: '#94a3b8' },
  statusBadge:   { padding: '0.3rem 0.75rem', borderRadius: 20, color: '#fff', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' },

  bidCardBody:   { padding: '1rem 1.2rem' },
  infoGrid:      { display: 'grid', gap: '0.75rem', marginBottom: '1rem' },
  infoItem:      { display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  infoLbl:       { fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em' },
  infoVal:       { fontSize: '0.875rem', color: '#1a2e44', fontWeight: 600 },

  messageBox:    { backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 7, padding: '0.75rem 0.9rem' },
  messageLbl:    { display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.3rem' },
  messageText:   { margin: 0, fontSize: '0.875rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.55 },

  bannerAccepted: { padding: '0.75rem 1.2rem', backgroundColor: '#16a34a', color: '#fff', fontSize: '0.85rem', fontWeight: 600 },
  bannerRejected: { padding: '0.75rem 1.2rem', backgroundColor: '#dc2626', color: '#fff', fontSize: '0.85rem' },
};