// src/pages/manufacturer/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, tenderAPI, bidAPI } from '../../services/api';
import ManufacturerLayout from '../../components/ManufacturerLayout';

function isClosed(t) {
  const end = new Date(t.end_date); end.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  return end < today;
}
const statusColor = (s) => ({ pending:'#d97706', accepted:'#16a34a', rejected:'#dc2626' }[s] || '#64748b');
const statusBg    = (s) => ({ pending:'#fffbeb', accepted:'#f0fdf4', rejected:'#fef2f2' }[s] || '#f8fafc');

export default function DashboardPage() {
  const user     = getUser();
  const navigate = useNavigate();
  const [allTenders, setAllTenders] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selectedTender, setSelectedTender] = useState(null);
  const [tenderBids,     setTenderBids]     = useState([]);
  const [showModal,      setShowModal]      = useState(false);
  const [loadingBids,    setLoadingBids]    = useState(false);
  const [acceptingBid,   setAcceptingBid]   = useState(null);

  useEffect(() => { fetchTenders(); }, []);

  const fetchTenders = async () => {
    setLoading(true);
    try { const r = await tenderAPI.getAllTenders(); setAllTenders(r.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const myTenders        = allTenders.filter(t => t.manufacturer === user?.id || t.manufacturer_id === user?.id);
  const dashboardTenders = allTenders.filter(t => isClosed(t) || t.status === 'closed');
  const activeTenders    = myTenders.filter(t => t.status === 'active' && !isClosed(t)).length;
  const myTotalBids      = myTenders.reduce((s, t) => s + (t.bid_count || 0), 0);
  const myClosedCount    = myTenders.filter(t => t.status === 'closed' || isClosed(t)).length;

  const handleViewBids = async (tender) => {
    setSelectedTender(tender); setShowModal(true);
    setLoadingBids(true); setTenderBids([]);
    try { const r = await tenderAPI.getTenderBids(tender.id); setTenderBids(r.data); }
    catch { alert('Failed to load bids.'); }
    finally { setLoadingBids(false); }
  };

  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Accept this bid? All other bids will be rejected.')) return;
    setAcceptingBid(bidId);
    try {
      await bidAPI.acceptBid(bidId);
      const r = await tenderAPI.getTenderBids(selectedTender.id);
      setTenderBids(r.data); fetchTenders();
      alert('Bid accepted successfully!');
    } catch (e) { alert(e.response?.data?.error || 'Failed.'); }
    finally { setAcceptingBid(null); }
  };

  const tenderClosed = selectedTender && isClosed(selectedTender);
  const bidAccepted  = tenderBids.some(b => b.status === 'accepted');
  const bidAmounts   = tenderBids.map(b => parseFloat(b.bid_amount));
  const bidStats     = tenderBids.length ? { highest: Math.max(...bidAmounts), lowest: Math.min(...bidAmounts) } : null;

  return (
    <ManufacturerLayout>
      {/* Header */}
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Dashboard</h2>
          <p style={s.pageSubtitle}>Welcome back, <strong>{user?.first_name}</strong>! Here's your market overview.</p>
        </div>
        <button style={s.addBtn} onClick={() => navigate('/manufacturer/create-tender')}>+ Create Tender</button>
      </div>

      {/* Stat cards */}
      <div style={s.statsRow}>
        {[
          { icon:'📦', label:'Total Tenders',      val: dashboardTenders.length, sub:'Closed & Expired', gold: false },
          { icon:'✅', label:'My Active Tenders',   val: activeTenders,           sub:'Currently Open',  gold: true  },
          { icon:'💰', label:'My Total Bids',       val: myTotalBids,             sub:'Received on Mine',gold: false },
          { icon:'🔒', label:'My Closed Tenders',   val: myClosedCount,           sub:'Completed / Expired', gold: false },
        ].map(c => (
          <div key={c.label} style={{ ...s.statCard, ...(c.gold ? s.statCardGold : {}) }}>
            <div style={s.statIcon}>{c.icon}</div>
            <p style={{ ...s.statLbl, ...(!c.gold ? { color:'#64748b' } : {}) }}>{c.label}</p>
            <p style={{ ...s.statVal, ...(!c.gold ? { color:'#1a2e44' } : {}) }}>{c.val}</p>
            <p style={{ ...s.statSub, ...(c.gold ? { color:'rgba(255,255,255,0.7)' } : {}) }}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Section label */}
      <div style={s.sectionLabelRow}>
        <span style={s.sectionLabel}>All Tenders</span>
        <span style={s.sectionNote}>Showing all closed &amp; expired tenders from all manufacturers</span>
      </div>

      {/* Table */}
      <div style={s.tableCard}>
        <div style={s.tableHead}>
          {['Title','Closing Date','Status','Actions'].map(h => <span key={h} style={s.thCell}>{h}</span>)}
        </div>
        {loading ? (
          <div style={s.tableEmpty}><p style={s.emptyTxt}>Loading tenders…</p></div>
        ) : dashboardTenders.length === 0 ? (
          <div style={s.tableEmpty}>
            <p style={s.emptyTxt}>No closed tenders yet. Other manufacturers' tenders appear here once their bidding period ends.</p>
          </div>
        ) : dashboardTenders.map((tender, idx) => {
          const closed    = isClosed(tender);
          const completed = tender.status === 'closed';
          const isOwn     = tender.manufacturer === user?.id || tender.manufacturer_id === user?.id;
          return (
            <div key={tender.id} style={{ ...s.tableRow, backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
              <div style={s.tdCell}>
                <span style={s.tdTitle}>{tender.tender_title}</span>
                <span style={s.tdSub}>{tender.tender_number}{!isOwn && <span style={{color:'#d4922a'}}> · Other Manufacturer</span>}</span>
              </div>
              <div style={s.tdCell}><span style={s.tdDate}>{new Date(tender.end_date).toISOString().split('T')[0]}</span></div>
              <div style={s.tdCell}>
                {completed ? <span style={s.sCompleted}>Completed</span>
                  : closed ? <span style={s.sExpired}>Expired</span>
                  : <span style={s.sOpen}>Open</span>}
              </div>
              <div style={s.tdCell}>
                {isOwn ? (
                  <button
                    style={{ ...s.viewBtn, ...(tender.bid_count===0 ? s.viewBtnDisabled : {}), ...(closed&&!completed&&tender.bid_count>0 ? s.viewBtnUrgent : {}), ...(completed ? s.viewBtnDone : {}) }}
                    onClick={() => handleViewBids(tender)} disabled={tender.bid_count===0}
                  >
                    {tender.bid_count===0 ? 'No Bids' : completed ? 'View Winner →' : closed ? `Select Winner (${tender.bid_count}) →` : `View Bids (${tender.bid_count}) →`}
                  </button>
                ) : (
                  <span style={s.viewOnlyBadge}>{completed ? '✅ Closed' : '⏰ Ended'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bids Modal */}
      {showModal && selectedTender && (
        <div style={s.overlay} onClick={() => setShowModal(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>Bids — {selectedTender.tender_title}</h2>
                <p style={s.modalSub}>{selectedTender.tender_number}{tenderClosed && <span style={{color:'#b91c1c',fontWeight:700}}> · Tender Closed</span>}</p>
              </div>
              <button style={s.closeBtn} onClick={() => setShowModal(false)}>×</button>
            </div>
            <div style={s.modalBody}>
              {loadingBids ? <p style={s.loadingTxt}>Loading bids…</p>
                : tenderBids.length === 0 ? <p style={s.loadingTxt}>No bids received yet.</p>
                : <>
                  {tenderClosed && !bidAccepted && (
                    <div style={s.noticeWarn}><strong>🎯 Tender Closed — Select a Winner</strong>
                      <p style={{margin:'0.4rem 0 0',fontSize:'0.875rem'}}>Review all bids below and accept one. All others will be automatically rejected.</p>
                    </div>
                  )}
                  {bidAccepted && <div style={s.noticeSuccess}><strong>🎉 Winner Selected!</strong><p style={{margin:'0.4rem 0 0',fontSize:'0.875rem'}}>The winning buyer has been notified.</p></div>}
                  {bidStats && (
                    <div style={s.bidStatsRow}>
                      {[['Highest Bid',`$${bidStats.highest.toLocaleString()}`],['Lowest Bid',`$${bidStats.lowest.toLocaleString()}`],['Total Bids',tenderBids.length]].map(([l,v]) => (
                        <div key={l} style={s.bidStatBox}><span style={s.bidStatLbl}>{l}</span><span style={s.bidStatVal}>{v}</span></div>
                      ))}
                    </div>
                  )}
                  <h3 style={s.bidsListTitle}>All Bids ({tenderBids.length})</h3>
                  {tenderBids.map((bid, i) => (
                    <div key={bid.id} style={{ ...s.bidCard, backgroundColor:statusBg(bid.status), border:`2px solid ${bid.status==='accepted'?'#16a34a':bid.status==='rejected'?'#fca5a5':'#e2e8f0'}`, opacity:bid.status==='rejected'?0.65:1 }}>
                      <div style={s.bidCardHead}>
                        <span style={s.bidNum}>Bid #{i+1}{bid.status==='accepted'&&<span style={{color:'#d97706'}}> 🏆 WINNER</span>}</span>
                        <span style={{color:statusColor(bid.status),fontWeight:700,fontSize:'0.8rem'}}>{bid.status.toUpperCase()}</span>
                      </div>
                      <div style={s.bidRows}>
                        {[['Buyer',bid.buyer_details?.company_name||'N/A'],['Contact',bid.buyer_details?.email||'N/A'],['Phone',bid.buyer_details?.phone_number||'N/A'],['Submitted',new Date(bid.created_at).toLocaleString()]].map(([l,v]) => (
                          <div key={l} style={s.bidRow}><span style={s.bidLbl}>{l}</span><span style={s.bidVal}>{v}</span></div>
                        ))}
                        <div style={s.bidRow}><span style={s.bidLbl}>Bid Amount</span><span style={{...s.bidAmt,fontSize:bid.status==='accepted'?'1.5rem':'1.2rem'}}>${parseFloat(bid.bid_amount).toLocaleString()}</span></div>
                        {bid.message && <div style={s.bidRow}><span style={s.bidLbl}>Message</span><span style={{...s.bidVal,fontStyle:'italic'}}>{bid.message}</span></div>}
                      </div>
                      {tenderClosed && !bidAccepted && bid.status==='pending' && (
                        <div style={{marginTop:'1rem',paddingTop:'0.85rem',borderTop:'1px solid #e2e8f0'}}>
                          <button style={{...s.acceptBtn,...(acceptingBid===bid.id?{backgroundColor:'#94a3b8',cursor:'not-allowed'}:{})}} onClick={()=>handleAcceptBid(bid.id)} disabled={acceptingBid!==null}>
                            {acceptingBid===bid.id?'⏳ Accepting…':'✅ Accept This Bid'}
                          </button>
                        </div>
                      )}
                      {bid.status==='accepted' && <div style={s.msgSuccess}>✨ Accepted! The buyer has been notified.</div>}
                      {bid.status==='rejected' && <div style={s.msgRejected}>Automatically rejected because another bid was accepted.</div>}
                    </div>
                  ))}
                </>}
            </div>
          </div>
        </div>
      )}
    </ManufacturerLayout>
  );
}

const s = {
  pageHeader:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'},
  pageTitle:{margin:'0 0 0.3rem',color:'#1a2e44',fontSize:'1.4rem',fontWeight:700},
  pageSubtitle:{margin:0,color:'#64748b',fontSize:'0.9rem'},
  addBtn:{padding:'0.55rem 1.25rem',backgroundColor:'#27ae60',color:'#fff',border:'none',borderRadius:7,cursor:'pointer',fontSize:'0.9rem',fontWeight:600},
  statsRow:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1.2rem',marginBottom:'1.75rem'},
  statCard:{backgroundColor:'#fff',border:'1.5px solid #e2e8f0',borderRadius:10,padding:'1.4rem 1.6rem',display:'flex',flexDirection:'column',gap:'0.3rem'},
  statCardGold:{backgroundColor:'#118341ff',border:'1.5px solid #27ae60'},
  statIcon:{fontSize:'1.75rem',marginBottom:'0.4rem'},
  statLbl:{margin:0,fontSize:'0.82rem',color:'rgba(255,255,255,0.85)',fontWeight:500},
  statVal:{margin:0,fontSize:'2rem',fontWeight:700,color:'#fff',lineHeight:1.1},
  statSub:{margin:'0.2rem 0 0',fontSize:'0.75rem',color:'#94a3b8'},
  sectionLabelRow:{display:'flex',alignItems:'baseline',gap:'0.6rem',marginBottom:'0.75rem',flexWrap:'wrap'},
  sectionLabel:{fontSize:'0.875rem',fontWeight:700,color:'#1a2e44'},
  sectionNote:{fontSize:'0.78rem',color:'#94a3b8'},
  tableCard:{backgroundColor:'#fff',borderRadius:10,border:'1.5px solid #e2e8f0',overflow:'hidden',marginBottom:'1rem'},
  tableHead:{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1.3fr',backgroundColor:'#1a2e44',padding:'0.8rem 1.4rem',gap:'1rem'},
  thCell:{color:'#fff',fontSize:'0.78rem',fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase'},
  tableRow:{display:'grid',gridTemplateColumns:'2fr 1.2fr 1fr 1.3fr',padding:'0.95rem 1.4rem',gap:'1rem',alignItems:'center',borderBottom:'1px solid #f0f2f5'},
  tdCell:{display:'flex',flexDirection:'column',gap:'0.18rem'},
  tdTitle:{fontWeight:600,color:'#1a2e44',fontSize:'0.92rem'},
  tdSub:{fontSize:'0.75rem',color:'#94a3b8'},
  tdDate:{color:'#4a5568',fontSize:'0.875rem'},
  sOpen:{color:'#16a34a',fontWeight:700,fontSize:'0.875rem'},
  sExpired:{color:'#b91c1c',fontWeight:700,fontSize:'0.875rem'},
  sCompleted:{color:'#4a5568',fontWeight:700,fontSize:'0.875rem'},
  viewBtn:{padding:'0.42rem 0.9rem',backgroundColor:'#fff',color:'#1a2e44',border:'1.5px solid #cbd5e1',borderRadius:6,cursor:'pointer',fontSize:'0.82rem',fontWeight:600,whiteSpace:'nowrap'},
  viewBtnDisabled:{color:'#94a3b8',borderColor:'#e2e8f0',cursor:'not-allowed'},
  viewBtnUrgent:{backgroundColor:'#fee2e2',color:'#b91c1c',borderColor:'#fca5a5'},
  viewBtnDone:{backgroundColor:'#dcfce7',color:'#15803d',borderColor:'#86efac'},
  viewOnlyBadge:{fontSize:'0.8rem',color:'#64748b',fontWeight:500},
  tableEmpty:{textAlign:'center',padding:'3rem'},
  emptyTxt:{color:'#94a3b8',fontSize:'0.95rem'},
  overlay:{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000,padding:'2rem'},
  modal:{backgroundColor:'#fff',borderRadius:12,width:'100%',maxWidth:900,maxHeight:'90vh',overflow:'auto',boxShadow:'0 4px 24px rgba(0,0,0,0.2)'},
  modalHead:{padding:'1.4rem 1.5rem',borderBottom:'2px solid #e2e8f0',backgroundColor:'#f8fafc',display:'flex',justifyContent:'space-between',alignItems:'center'},
  modalTitle:{margin:0,color:'#1a2e44',fontSize:'1.3rem',fontWeight:700},
  modalSub:{margin:'0.3rem 0 0',color:'#64748b',fontSize:'0.875rem'},
  closeBtn:{background:'none',border:'none',fontSize:'1.8rem',cursor:'pointer',color:'#94a3b8',lineHeight:1},
  modalBody:{padding:'1.5rem'},
  loadingTxt:{textAlign:'center',color:'#64748b',padding:'2rem 0'},
  noticeWarn:{backgroundColor:'#fffbeb',border:'2px solid #f59e0b',borderRadius:8,padding:'1.1rem 1.25rem',marginBottom:'1.25rem',color:'#92400e'},
  noticeSuccess:{backgroundColor:'#f0fdf4',border:'2px solid #22c55e',borderRadius:8,padding:'1.1rem 1.25rem',marginBottom:'1.25rem',color:'#166534'},
  bidStatsRow:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem',marginBottom:'1.5rem'},
  bidStatBox:{backgroundColor:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'0.9rem 1rem',textAlign:'center'},
  bidStatLbl:{display:'block',fontSize:'0.78rem',color:'#64748b',marginBottom:'0.35rem'},
  bidStatVal:{display:'block',fontSize:'1.35rem',fontWeight:700,color:'#d4922a'},
  bidsListTitle:{margin:'0 0 1rem',color:'#1a2e44',fontWeight:700,fontSize:'1rem'},
  bidCard:{padding:'1.25rem',borderRadius:8,marginBottom:'1rem'},
  bidCardHead:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.85rem',paddingBottom:'0.6rem',borderBottom:'1px solid #e2e8f0'},
  bidNum:{fontWeight:700,color:'#1a2e44',fontSize:'0.95rem'},
  bidRows:{display:'flex',flexDirection:'column',gap:'0.5rem'},
  bidRow:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',paddingBottom:'0.38rem',borderBottom:'1px solid #f1f5f9'},
  bidLbl:{fontWeight:500,color:'#64748b',minWidth:110,fontSize:'0.845rem'},
  bidVal:{color:'#1a2e44',fontWeight:500,textAlign:'right',flex:1,fontSize:'0.845rem'},
  bidAmt:{fontWeight:700,color:'#d4922a',textAlign:'right',flex:1},
  acceptBtn:{width:'100%',padding:'0.7rem 1.25rem',backgroundColor:'#16a34a',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontSize:'0.95rem',fontWeight:700},
  msgSuccess:{marginTop:'0.85rem',padding:'0.75rem 0.9rem',backgroundColor:'#f0fdf4',border:'2px solid #22c55e',borderRadius:6,color:'#166534',fontSize:'0.845rem',fontWeight:600},
  msgRejected:{marginTop:'0.85rem',padding:'0.75rem 0.9rem',backgroundColor:'#fef2f2',border:'2px solid #fca5a5',borderRadius:6,color:'#991b1b',fontSize:'0.845rem'},
};