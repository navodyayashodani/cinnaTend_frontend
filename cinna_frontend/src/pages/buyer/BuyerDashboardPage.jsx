// src/pages/buyer/BuyerDashboardPage.jsx

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

  const [selectedTender, setSelectedTender] = useState(null);
  const [showModal,       setShowModal]      = useState(false);
  const [bidForm,         setBidForm]        = useState({ bid_amount: '', message: '' });
  const [bidErrors,       setBidErrors]      = useState({});
  const [submitting,      setSubmitting]     = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        tenderAPI.getAllTenders(),
        bidAPI.getAllBids(),
      ]);
      setTenders(tRes.data);
      setMyBids(bRes.data);
    } catch (err) {
      if (err.response?.status === 401) navigate('/');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: bid.tender can be either a number (id) or an object {id, ...}
  //         Normalise both so the lookup always works.
  const getTenderId = (bid) =>
    typeof bid.tender === 'object' ? bid.tender?.id : bid.tender;

  const getBidForTender = (tenderId) =>
    myBids.find(b => getTenderId(b) === tenderId);

  const filtered = filter === 'all' ? tenders : tenders.filter(t => t.status === filter);

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
    if (!bidForm.message.trim())
      errs.message = 'Message is required';
    if (Object.keys(errs).length) { setBidErrors(errs); return; }

    setSubmitting(true);
    try {
      await bidAPI.createBid({
        tender:     selectedTender.id,
        bid_amount: parseFloat(bidForm.bid_amount),
        message:    bidForm.message,
      });
      await fetchData();
      setShowModal(false);
    } catch (err) {
      if (err.response?.data && typeof err.response.data === 'object') {
        setBidErrors(err.response.data);
      } else {
        alert('Failed to submit bid. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activeTenders = tenders.filter(t => t.status === 'active').length;
  const acceptedBids  = myBids.filter(b => b.status === 'accepted').length;

  return (
    <BuyerLayout>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Dashboard</h2>
          <p style={s.pageSubtitle}>
            Welcome back, <strong>{user?.first_name}</strong>! Browse and bid on tenders.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={s.statsRow}>
        {[
          { icon: '📋', label: 'Available Tenders', val: tenders.length,  sub: 'Total listed',      gold: false },
          { icon: '✅', label: 'Active Tenders',    val: activeTenders,   sub: 'Open for bidding',  gold: true  },
          { icon: '💰', label: 'My Bids',           val: myBids.length,   sub: 'Total submitted',   gold: false },
          { icon: '🏆', label: 'Accepted Bids',     val: acceptedBids,    sub: 'Won tenders',       gold: false },
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
      <div style={s.filterRow}>
        <span style={s.sectionLabel}>Available Tenders</span>
        <div style={s.filters}>
          {['all', 'active', 'closed'].map(f => (
            <button
              key={f}
              style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tender table */}
      <div style={s.tableCard}>
        <div style={s.tableHead}>
          {['Title', 'Oil Type', 'Quantity', 'Quality', 'End Date', 'Bids', 'Action'].map(h =>
            <span key={h} style={s.thCell}>{h}</span>
          )}
        </div>

        {loading ? (
          <div style={s.empty}><p style={s.emptyTxt}>Loading tenders…</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}><p style={s.emptyTxt}>No tenders found.</p></div>
        ) : filtered.map((tender, idx) => {
          const myBid  = getBidForTender(tender.id);
          const closed = tender.status === 'closed';

          // Once a bid is submitted it cannot be edited — button disabled
          const canBid     = !closed && !myBid;   // no bid yet → can place
          const btnEnabled = canBid;

          // Button label
          const btnLabel = closed
            ? '🔒 Closed'
            : myBid
              ? `✅ Bid ${myBid.status.charAt(0).toUpperCase() + myBid.status.slice(1)}`
              : '+ Place Bid';

          return (
            <div
              key={tender.id}
              style={{ ...s.tableRow, backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}
            >
              <div style={s.tdCell}>
                <span style={s.tdTitle}>{tender.tender_title}</span>
                <span style={s.tdSub}>{tender.tender_number}</span>
              </div>
              <div style={s.tdCell}><span style={s.tdVal}>{tender.oil_type}</span></div>
              <div style={s.tdCell}><span style={s.tdVal}>{tender.quantity} L/Kg</span></div>
              <div style={s.tdCell}>
                {tender.quality_grade
                  ? <span style={s.qualityBadge}>{tender.quality_grade}</span>
                  : <span style={s.tdSub}>—</span>}
              </div>
              <div style={s.tdCell}>
                <span style={s.tdVal}>
                  {new Date(tender.end_date).toISOString().split('T')[0]}
                </span>
              </div>
              <div style={s.tdCell}><span style={s.tdVal}>{tender.bid_count ?? 0}</span></div>
              <div style={s.tdCell}>
                {/* Show current bid chip if one exists */}
                {myBid && (
                  <div style={{
                    ...s.myBidChip,
                    backgroundColor: statusBg(myBid.status),
                    color: statusColor(myBid.status),
                  }}>
                    ${parseFloat(myBid.bid_amount).toLocaleString()} · {myBid.status}
                  </div>
                )}
                <button
                  style={{ ...s.actionBtn, ...(!btnEnabled ? s.actionBtnDisabled : {}) }}
                  disabled={!btnEnabled}
                  onClick={() => btnEnabled && handleOpenModal(tender)}
                >
                  {btnLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Bid Modal ── */}
      {showModal && selectedTender && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>
                  Place a Bid
                </h2>
                <p style={s.modalSub}>
                  {selectedTender.tender_title} · {selectedTender.tender_number}
                </p>
              </div>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>

            <div style={s.modalBody}>
              {/* Tender summary */}
              <div style={s.tenderSummary}>
                {[
                  ['Oil Type',     selectedTender.oil_type],
                  ['Quantity',     `${selectedTender.quantity} L/Kg`],
                  ['Quality',      selectedTender.quality_grade
                                    ? `${selectedTender.quality_grade} (${selectedTender.quality_score}/100)`
                                    : '—'],
                  ['Manufacturer', selectedTender.manufacturer_details?.company_name || 'N/A'],
                  ['End Date',     new Date(selectedTender.end_date).toLocaleDateString()],
                ].map(([l, v]) => (
                  <div key={l} style={s.summaryRow}>
                    <span style={s.summaryLbl}>{l}</span>
                    <span style={s.summaryVal}>{v}</span>
                  </div>
                ))}
                {selectedTender.tender_description && (
                  <div style={{ ...s.summaryRow, flexDirection: 'column', gap: '0.3rem' }}>
                    <span style={s.summaryLbl}>Description</span>
                    <span style={{ ...s.summaryVal, textAlign: 'left', fontSize: '0.875rem', color: '#475569' }}>
                      {selectedTender.tender_description}
                    </span>
                  </div>
                )}
              </div>

              {/* Bid form */}
              <form onSubmit={handleSubmitBid}>
                <div style={s.formGroup}>
                  <label style={s.label}>
                    Bid Amount ($) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="bid_amount"
                    value={bidForm.bid_amount}
                    onChange={handleBidChange}
                    placeholder="Enter your bid amount"
                    step="0.01"
                    min="0"
                    style={{ ...s.input, ...(bidErrors.bid_amount ? s.inputErr : {}) }}
                  />
                  {bidErrors.bid_amount && <span style={s.errTxt}>{bidErrors.bid_amount}</span>}
                </div>

                <div style={s.formGroup}>
                  <label style={s.label}>
                    Message <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <textarea
                    name="message"
                    value={bidForm.message}
                    onChange={handleBidChange}
                    placeholder="Add a message with your bid…"
                    rows={4}
                    style={{ ...s.textarea, ...(bidErrors.message ? s.inputErr : {}) }}
                  />
                  {bidErrors.message && <span style={s.errTxt}>{bidErrors.message}</span>}
                </div>

                <div style={s.modalActions}>
                  <button type="button" style={s.cancelBtn} onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ ...s.submitBtn, ...(submitting ? s.submitBtnDisabled : {}) }}
                  >
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

  statsRow:          { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.2rem', marginBottom: '1.75rem' },
  statCard:          { backgroundColor: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '1.4rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' },
  statCardGold:      { backgroundColor: '#118341ff', border: '1.5px solid #27ae60' },
  statIcon:          { fontSize: '1.75rem', marginBottom: '0.4rem' },
  statLbl:           { margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 },
  statVal:           { margin: 0, fontSize: '2rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 },
  statSub:           { margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#94a3b8' },

  filterRow:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' },
  sectionLabel:      { fontSize: '0.875rem', fontWeight: 700, color: '#1a2e44' },
  filters:           { display: 'flex', gap: '0.5rem' },
  filterBtn:         { padding: '0.38rem 0.9rem', border: '1.5px solid #e2e8f0', borderRadius: 6, backgroundColor: '#fff', color: '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 },
  filterActive:      { backgroundColor: '#1a2e44', color: '#fff', borderColor: '#1a2e44' },

  tableCard:         { backgroundColor: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', overflow: 'hidden' },
  tableHead:         { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.6fr 1.5fr', backgroundColor: '#1a2e44', padding: '0.8rem 1.4rem', gap: '1rem' },
  thCell:            { color: '#fff', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' },
  tableRow:          { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.6fr 1.5fr', padding: '0.95rem 1.4rem', gap: '1rem', alignItems: 'center', borderBottom: '1px solid #f0f2f5' },
  tdCell:            { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
  tdTitle:           { fontWeight: 600, color: '#1a2e44', fontSize: '0.92rem' },
  tdSub:             { fontSize: '0.75rem', color: '#94a3b8' },
  tdVal:             { color: '#4a5568', fontSize: '0.875rem' },
  qualityBadge:      { display: 'inline-block', padding: '0.2rem 0.6rem', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: 5, fontSize: '0.78rem', fontWeight: 700, width: 'fit-content' },
  myBidChip:         { padding: '0.2rem 0.55rem', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, width: 'fit-content', marginBottom: '0.3rem' },
  actionBtn:         { padding: '0.42rem 0.9rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap' },
  actionBtnDisabled: { backgroundColor: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' },
  empty:             { textAlign: 'center', padding: '3rem' },
  emptyTxt:          { color: '#94a3b8', fontSize: '0.95rem' },

  overlay:           { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' },
  modal:             { backgroundColor: '#fff', borderRadius: 12, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' },
  modalHead:         { padding: '1.4rem 1.5rem', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle:        { margin: 0, color: '#1a2e44', fontSize: '1.2rem', fontWeight: 700 },
  modalSub:          { margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.875rem' },
  closeBtn:          { background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 },
  modalBody:         { padding: '1.5rem' },

  tenderSummary:     { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  summaryRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.4rem', borderBottom: '1px solid #f1f5f9' },
  summaryLbl:        { fontSize: '0.82rem', color: '#64748b', fontWeight: 600, minWidth: 110 },
  summaryVal:        { fontSize: '0.875rem', color: '#1a2e44', fontWeight: 500, textAlign: 'right' },


  formGroup:         { marginBottom: '1.1rem' },
  label:             { display: 'block', marginBottom: '0.45rem', color: '#1a2e44', fontWeight: 600, fontSize: '0.875rem' },
  input:             { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#1a2e44', boxSizing: 'border-box' },
  textarea:          { width: '100%', padding: '0.65rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: 7, fontSize: '0.9rem', color: '#1a2e44', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' },
  inputErr:          { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  errTxt:            { color: '#dc2626', fontSize: '0.8rem', marginTop: '0.3rem', display: 'block' },
  modalActions:      { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', marginTop: '0.5rem' },
  cancelBtn:         { padding: '0.6rem 1.4rem', backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 },
  submitBtn:         { padding: '0.6rem 1.75rem', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700 },
  submitBtnDisabled: { backgroundColor: '#94a3b8', cursor: 'not-allowed' },
};