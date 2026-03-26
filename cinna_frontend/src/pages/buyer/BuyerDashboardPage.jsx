// src/pages/buyer/BuyerDashboardPage.jsx  — MOBILE RESPONSIVE FIXED

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenderAPI, bidAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BuyerLayout from '../../components/BuyerLayout';

const statusColor  = (s) => ({ pending: '#d97706', accepted: '#16a34a', rejected: '#dc2626' }[s] || '#64748b');
const statusBg     = (s) => ({ pending: '#fffbeb', accepted: '#f0fdf4', rejected: '#fef2f2' }[s] || '#f8fafc');

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [tenders,  setTenders]  = useState([]);
  const [myBids,   setMyBids]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [selectedTender, setSelectedTender] = useState(null);
  const [showModal,       setShowModal]      = useState(false);
  const [bidForm,         setBidForm]        = useState({ bid_amount: '', message: '' });
  const [bidErrors,       setBidErrors]      = useState({});
  const [submitting,      setSubmitting]     = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([tenderAPI.getAllTenders(), bidAPI.getAllBids()]);
      setTenders(tRes.data);
      setMyBids(bRes.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getTenderId = (bid) => typeof bid.tender === 'object' ? bid.tender?.id : bid.tender;
  const getBidForTender = (tenderId) => myBids.find(b => getTenderId(b) === tenderId);

  const filtered = filter === 'all' ? tenders : tenders.filter(t => {
    const end = new Date(t.end_date); end.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    const ended = end < today;
    if (filter === 'closed') return t.status === 'closed' || ended;
    if (filter === 'active') return t.status === 'active' && !ended;
    return true;
  });

  const handleOpenModal = (tender) => {
    setSelectedTender(tender);
    setBidForm({ bid_amount: '', message: '' });
    setBidErrors({});
    setShowModal(true);
  };

  const handleBidChange = (e) => {
    const { name, value } = e.target;
    setBidForm(p => ({ ...p, [name]: value }));
    if (bidErrors[name]) setBidErrors(p => ({ ...p, [name]: '' }));
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!bidForm.bid_amount || parseFloat(bidForm.bid_amount) <= 0)
      errs.bid_amount = 'Bid amount must be greater than zero';
    if (!bidForm.message.trim()) errs.message = 'Message is required';
    if (Object.keys(errs).length) { setBidErrors(errs); return; }

    setSubmitting(true);
    try {
      await bidAPI.createBid({ tender: selectedTender.id, bid_amount: parseFloat(bidForm.bid_amount), message: bidForm.message });
      await fetchData();
      setShowModal(false);
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') setBidErrors(err.response.data);
      else alert('Failed to submit bid. Please try again.');
    } finally { setSubmitting(false); }
  };

  const activeTenders = tenders.filter(t => t.status === 'active').length;
  const acceptedBids  = myBids.filter(b => b.status === 'accepted').length;

  return (
    <BuyerLayout>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Dashboard</h2>
          <p style={s.pageSubtitle}>Welcome back, <strong>{user?.first_name}</strong>! Browse and bid on tenders.</p>
        </div>
      </div>

      {/* Stat cards — 2 cols mobile, 4 cols desktop */}
      <div style={{ ...s.statsRow, gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)' }}>
        {[
          { icon: '📋', label: 'Available Tenders', val: tenders.length,  sub: 'Total listed',     gold: false },
          { icon: '✅', label: 'Active Tenders',    val: activeTenders,   sub: 'Open for bidding', gold: true  },
          { icon: '💰', label: 'My Bids',           val: myBids.length,   sub: 'Total submitted',  gold: false },
          { icon: '🏆', label: 'Accepted Bids',     val: acceptedBids,    sub: 'Won tenders',      gold: false },
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
        <span style={s.sectionLabel}>Available Tenders</span>
        <div style={{ ...s.filters, flexWrap: 'wrap' }}>
          {['all', 'active', 'closed'].map(f => (
            <button key={f} style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tender list — TABLE on desktop, CARDS on mobile */}
      {loading ? (
        <div style={s.empty}><p style={s.emptyTxt}>Loading tenders…</p></div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}><p style={s.emptyTxt}>No tenders found.</p></div>
      ) : isMobile ? (
        /* ── MOBILE CARD VIEW ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((tender) => {
            const myBid = getBidForTender(tender.id);
            const end = new Date(tender.end_date); end.setHours(0,0,0,0);
            const today = new Date(); today.setHours(0,0,0,0);
            const tenderEnded = end < today;
            const closed = tender.status === 'closed' || tenderEnded;
            const canBid = !closed && !myBid;
            const btnLabel = closed
              ? tenderEnded && tender.status !== 'closed' ? '🕒 Ended' : '🔒 Closed'
              : myBid ? `✅ ${myBid.status.charAt(0).toUpperCase() + myBid.status.slice(1)}` : '+ Place Bid';

            return (
              <div key={tender.id} style={s.mobileCard}>
                <div style={s.mobileCardHead}>
                  <div>
                    <div style={s.mobileCardTitle}>{tender.tender_title}</div>
                    <div style={s.mobileCardNum}>{tender.tender_number}</div>
                  </div>
                  {tender.quality_grade && (
                    <span style={s.qualityBadge}>{tender.quality_grade}</span>
                  )}
                </div>
                <div style={s.mobileCardGrid}>
                  <div style={s.mobileField}><span style={s.mobileFieldLbl}>Oil Type</span><span style={s.mobileFieldVal}>{tender.oil_type}</span></div>
                  <div style={s.mobileField}><span style={s.mobileFieldLbl}>Quantity</span><span style={s.mobileFieldVal}>{tender.quantity} L/Kg</span></div>
                  <div style={s.mobileField}><span style={s.mobileFieldLbl}>Bids</span><span style={s.mobileFieldVal}>{tender.bid_count ?? 0}</span></div>
                  <div style={s.mobileField}>
                    <span style={s.mobileFieldLbl}>End Date</span>
                    <span style={{ ...s.mobileFieldVal, color: tenderEnded ? '#dc2626' : '#4a5568' }}>
                      {new Date(tender.end_date).toISOString().split('T')[0]}
                      {tenderEnded && <span style={{ display: 'block', fontSize: '0.68rem', color: '#dc2626' }}>Expired</span>}
                    </span>
                  </div>
                </div>
                {myBid && (
                  <div style={{ ...s.myBidChip, backgroundColor: statusBg(myBid.status), color: statusColor(myBid.status), margin: '0.5rem 0 0' }}>
                    Your bid: ${parseFloat(myBid.bid_amount).toLocaleString()} · {myBid.status}
                  </div>
                )}
                <button
                  style={{ ...s.actionBtn, ...(!canBid ? s.actionBtnDisabled : {}), marginTop: '0.75rem', width: '100%' }}
                  disabled={!canBid}
                  onClick={() => canBid && handleOpenModal(tender)}
                >
                  {btnLabel}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DESKTOP TABLE VIEW ── */
        <div style={s.tableCard}>
          <div style={s.tableHead}>
            {['Title', 'Oil Type', 'Quantity', 'Quality', 'End Date', 'Bids', 'Action'].map(h =>
              <span key={h} style={s.thCell}>{h}</span>
            )}
          </div>
          {filtered.map((tender, idx) => {
            const myBid = getBidForTender(tender.id);
            const end = new Date(tender.end_date); end.setHours(0,0,0,0);
            const today = new Date(); today.setHours(0,0,0,0);
            const tenderEnded = end < today;
            const closed = tender.status === 'closed' || tenderEnded;
            const canBid = !closed && !myBid;
            const btnLabel = closed
              ? tenderEnded && tender.status !== 'closed' ? '🕒 Tender Ended' : '🔒 Closed'
              : myBid ? `✅ Bid ${myBid.status.charAt(0).toUpperCase() + myBid.status.slice(1)}` : '+ Place Bid';

            return (
              <div key={tender.id} style={{ ...s.tableRow, backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <div style={s.tdCell}><span style={s.tdTitle}>{tender.tender_title}</span><span style={s.tdSub}>{tender.tender_number}</span></div>
                <div style={s.tdCell}><span style={s.tdVal}>{tender.oil_type}</span></div>
                <div style={s.tdCell}><span style={s.tdVal}>{tender.quantity} L/Kg</span></div>
                <div style={s.tdCell}>{tender.quality_grade ? <span style={s.qualityBadge}>{tender.quality_grade}</span> : <span style={s.tdSub}>—</span>}</div>
                <div style={s.tdCell}>
                  <span style={{ ...s.tdVal, color: tenderEnded ? '#dc2626' : '#4a5568', fontWeight: tenderEnded ? 600 : 400 }}>
                    {new Date(tender.end_date).toISOString().split('T')[0]}
                  </span>
                  {tenderEnded && <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 600 }}>Expired</span>}
                </div>
                <div style={s.tdCell}><span style={s.tdVal}>{tender.bid_count ?? 0}</span></div>
                <div style={s.tdCell}>
                  {myBid && (
                    <div style={{ ...s.myBidChip, backgroundColor: statusBg(myBid.status), color: statusColor(myBid.status) }}>
                      ${parseFloat(myBid.bid_amount).toLocaleString()} · {myBid.status}
                    </div>
                  )}
                  <button style={{ ...s.actionBtn, ...(!canBid ? s.actionBtnDisabled : {}) }} disabled={!canBid} onClick={() => canBid && handleOpenModal(tender)}>
                    {btnLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Bid Modal ── */}
      {showModal && selectedTender && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={{ ...s.modal, width: isMobile ? '95%' : '100%', maxHeight: isMobile ? '95vh' : '90vh' }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>Place a Bid</h2>
                <p style={s.modalSub}>{selectedTender.tender_title} · {selectedTender.tender_number}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              <div style={s.tenderSummary}>
                {[
                  ['Oil Type', selectedTender.oil_type],
                  ['Quantity', `${selectedTender.quantity} L/Kg`],
                  ['Quality', selectedTender.quality_grade ? `${selectedTender.quality_grade} (${selectedTender.quality_score}/100)` : '—'],
                  ['Manufacturer', selectedTender.manufacturer_details?.company_name || 'N/A'],
                  ['End Date', new Date(selectedTender.end_date).toLocaleDateString()],
                ].map(([l, v]) => (
                  <div key={l} style={s.summaryRow}>
                    <span style={s.summaryLbl}>{l}</span>
                    <span style={s.summaryVal}>{v}</span>
                  </div>
                ))}
                {selectedTender.tender_description && (
                  <div style={{ ...s.summaryRow, flexDirection: 'column', gap: '0.3rem' }}>
                    <span style={s.summaryLbl}>Description</span>
                    <span style={{ ...s.summaryVal, textAlign: 'left', fontSize: '0.875rem', color: '#475569' }}>{selectedTender.tender_description}</span>
                  </div>
                )}
              </div>
              <form onSubmit={handleSubmitBid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Bid Amount ($) <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="number" name="bid_amount" value={bidForm.bid_amount} onChange={handleBidChange} placeholder="Enter your bid amount" step="0.01" min="0" style={{ ...s.input, ...(bidErrors.bid_amount ? s.inputErr : {}) }} />
                  {bidErrors.bid_amount && <span style={s.errTxt}>{bidErrors.bid_amount}</span>}
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Message <span style={{ color: '#dc2626' }}>*</span></label>
                  <textarea name="message" value={bidForm.message} onChange={handleBidChange} placeholder="Add a message with your bid…" rows={4} style={{ ...s.textarea, ...(bidErrors.message ? s.inputErr : {}) }} />
                  {bidErrors.message && <span style={s.errTxt}>{bidErrors.message}</span>}
                </div>
                <div style={{ ...s.modalActions, flexDirection: isMobile ? 'column' : 'row' }}>
                  <button type="button" style={{ ...s.cancelBtn, width: isMobile ? '100%' : 'auto' }} onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} style={{ ...s.submitBtn, ...(submitting ? s.submitBtnDisabled : {}), width: isMobile ? '100%' : 'auto' }}>
                    {submitting ? '⏳ Submitting…' : '✅ Place Bid'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </BuyerLayout>
  );
}

const s = {
  pageHeader:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  pageTitle:         { margin: '0 0 0.3rem', color: '#1a2e44', fontSize: '1.4rem', fontWeight: 700 },
  pageSubtitle:      { margin: 0, color: '#64748b', fontSize: '0.9rem' },

  statsRow:          { display: 'grid', gap: '1rem', marginBottom: '1.75rem' },
  statCard:          { backgroundColor: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '1.2rem 1.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  statCardGold:      { backgroundColor: '#118341ff', border: '1.5px solid #27ae60' },
  statIcon:          { fontSize: '1.5rem', marginBottom: '0.3rem' },
  statLbl:           { margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  statVal:           { margin: 0, fontSize: '1.8rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 },
  statSub:           { margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#94a3b8' },

  filterRow:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  sectionLabel:      { fontSize: '0.875rem', fontWeight: 700, color: '#1a2e44' },
  filters:           { display: 'flex', gap: '0.5rem' },
  filterBtn:         { padding: '0.38rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 },
  filterActive:      { backgroundColor: '#1a2e44', color: '#fff', borderColor: '#1a2e44' },

  /* Desktop table */
  tableCard:         { backgroundColor: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', overflow: 'hidden' },
  tableHead:         { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.6fr 1.5fr', backgroundColor: '#1a2e44', padding: '0.8rem 1.4rem', gap: '1rem' },
  thCell:            { color: '#fff', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' },
  tableRow:          { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.6fr 1.5fr', padding: '0.95rem 1.4rem', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #f0f2f5' },
  tdCell:            { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  tdTitle:           { fontWeight: 600, color: '#1a2e44', fontSize: '0.92rem' },
  tdSub:             { fontSize: '0.75rem', color: '#94a3b8' },
  tdVal:             { color: '#4a5568', fontSize: '0.875rem' },

  /* Mobile card */
  mobileCard:        { backgroundColor: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '1rem 1.1rem' },
  mobileCardHead:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' },
  mobileCardTitle:   { fontWeight: 700, color: '#1a2e44', fontSize: '0.95rem' },
  mobileCardNum:     { fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' },
  mobileCardGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' },
  mobileField:       { display: 'flex', flexDirection: 'column', gap: '0.15rem' },
  mobileFieldLbl:    { fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' },
  mobileFieldVal:    { fontSize: '0.85rem', color: '#1a2e44', fontWeight: 500 },

  qualityBadge:      { display: 'inline-block', padding: '0.2rem 0.6rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: 5, fontSize: '0.78rem', fontWeight: 700, width: 'fit-content' },
  myBidChip:         { padding: '0.2rem 0.55rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, width: 'fit-content', marginBottom: '0.3rem' },
  actionBtn:         { padding: '0.42rem 0.9rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' },
  actionBtnDisabled: { backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' },
  empty:             { textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0' },
  emptyTxt:          { color: '#94a3b8', fontSize: '0.95rem' },

  overlay:           { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' },
  modal:             { backgroundColor: '#fff', borderRadius: 12, maxWidth: 600, overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' },
  modalHead:         { padding: '1.2rem 1.4rem', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:        { margin: 0, color: '#1a2e44', fontSize: '1.1rem', fontWeight: 700 },
  modalSub:          { margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.82rem' },
  closeBtn:          { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 },
  modalBody:         { padding: '1.25rem' },

  tenderSummary:     { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.9rem 1rem', marginBottom: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  summaryRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' },
  summaryLbl:        { fontSize: '0.8rem', color: '#64748b', fontWeight: 600, minWidth: 90 },
  summaryVal:        { fontSize: '0.85rem', color: '#1a2e44', fontWeight: 500, textAlign: 'right' },

  formGroup:         { marginBottom: '1rem' },
  label:             { display: 'block', marginBottom: '0.4rem', color: '#1a2e44', fontWeight: 600, fontSize: '0.875rem' },
  input:             { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#1a2e44', boxSizing: 'border-box' },
  textarea:          { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#1a2e44', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  inputErr:          { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  errTxt:            { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' },
  modalActions:      { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', marginTop: '0.5rem' },
  cancelBtn:         { padding: '0.6rem 1.4rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  submitBtn:         { padding: '0.6rem 1.75rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
  submitBtnDisabled: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
};