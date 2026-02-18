// src/pages/manufacturer/AnalyticsPage.jsx

import React, { useState, useEffect } from 'react';
import { getUser, tenderAPI } from '../../services/api';
import ManufacturerLayout from '../../components/ManufacturerLayout';

function isClosed(t) {
  const end = new Date(t.end_date); end.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  return end < today;
}

export default function AnalyticsPage() {
  const user = getUser();
  const [allTenders, setAllTenders] = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    tenderAPI.getAllTenders()
      .then(r => setAllTenders(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myTenders   = allTenders.filter(t => t.manufacturer === user?.id || t.manufacturer_id === user?.id);
  const active      = myTenders.filter(t => t.status === 'active' && !isClosed(t));
  const expired     = myTenders.filter(t => isClosed(t) && t.status !== 'closed');
  const completed   = myTenders.filter(t => t.status === 'closed');
  const totalBids   = myTenders.reduce((s,t) => s + (t.bid_count||0), 0);
  const avgBids     = myTenders.length ? (totalBids / myTenders.length).toFixed(1) : 0;
  const withBids    = myTenders.filter(t => (t.bid_count||0) > 0).length;
  const successRate = myTenders.length ? Math.round((completed.length / myTenders.length) * 100) : 0;

  // Simple bar chart data
  const maxBids = Math.max(...myTenders.map(t => t.bid_count||0), 1);

  const gradeCount = myTenders.reduce((acc, t) => {
    if (t.quality_grade) acc[t.quality_grade] = (acc[t.quality_grade]||0) + 1;
    return acc;
  }, {});

  return (
    <ManufacturerLayout>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Analytics</h2>
          <p style={s.pageSubtitle}>Performance insights for your tender activity</p>
        </div>
      </div>

      {loading ? (
        <div style={s.loading}>Loading analytics…</div>
      ) : myTenders.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>📊</div>
          <p style={s.emptyTitle}>No data yet</p>
          <p style={s.emptyText}>Create your first tender to start seeing analytics here.</p>
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div style={s.kpiGrid}>
            {[
              { icon:'📦', label:'Total Tenders',  val:myTenders.length, color:'#1a2e44' },
              { icon:'✅', label:'Active',          val:active.length,    color:'#16a34a' },
              { icon:'⏰', label:'Expired',         val:expired.length,   color:'#b91c1c' },
              { icon:'🏆', label:'Completed',       val:completed.length, color:'#d4922a' },
              { icon:'💰', label:'Total Bids',      val:totalBids,        color:'#1a2e44' },
              { icon:'📈', label:'Avg Bids/Tender', val:avgBids,          color:'#7c3aed' },
              { icon:'🎯', label:'Tenders w/ Bids', val:withBids,         color:'#0891b2' },
              { icon:'✨', label:'Success Rate',    val:`${successRate}%`, color:'#16a34a' },
            ].map(k => (
              <div key={k.label} style={s.kpiCard}>
                <span style={s.kpiIcon}>{k.icon}</span>
                <span style={{ ...s.kpiVal, color:k.color }}>{k.val}</span>
                <span style={s.kpiLabel}>{k.label}</span>
              </div>
            ))}
          </div>

          {/* Tender status breakdown */}
          <div style={s.row}>
            <div style={s.panel}>
              <p style={s.panelTitle}>Tender Status Breakdown</p>
              {[
                { label:'Active',    count:active.length,    color:'#16a34a', bg:'#dcfce7' },
                { label:'Expired',   count:expired.length,   color:'#b91c1c', bg:'#fee2e2' },
                { label:'Completed', count:completed.length, color:'#d4922a', bg:'#fef3c7' },
              ].map(item => {
                const pct = myTenders.length ? Math.round((item.count/myTenders.length)*100) : 0;
                return (
                  <div key={item.label} style={s.barRow}>
                    <span style={s.barLabel}>{item.label}</span>
                    <div style={s.barTrack}>
                      <div style={{ ...s.barFill, width:`${pct}%`, backgroundColor:item.color }} />
                    </div>
                    <span style={{ ...s.barCount, color:item.color }}>{item.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>

            {/* Quality grade breakdown */}
            <div style={s.panel}>
              <p style={s.panelTitle}>Quality Grade Distribution</p>
              {Object.keys(gradeCount).length === 0 ? (
                <p style={s.noData}>No quality grades available. Upload lab reports when creating tenders.</p>
              ) : (
                ['A+','A','B','C','D'].filter(g => gradeCount[g]).map(g => {
                  const gColors = {'A+':'#16a34a','A':'#15803d','B':'#d97706','C':'#b45309','D':'#b91c1c'};
                  const pct = Math.round((gradeCount[g]/myTenders.length)*100);
                  return (
                    <div key={g} style={s.barRow}>
                      <span style={{ ...s.barLabel, fontWeight:700, color:gColors[g] }}>Grade {g}</span>
                      <div style={s.barTrack}>
                        <div style={{ ...s.barFill, width:`${pct}%`, backgroundColor:gColors[g] }} />
                      </div>
                      <span style={{ ...s.barCount, color:gColors[g] }}>{gradeCount[g]} ({pct}%)</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bid activity per tender */}
          <div style={s.panel}>
            <p style={s.panelTitle}>Bid Activity per Tender</p>
            {myTenders.length === 0 ? <p style={s.noData}>No tenders yet.</p> : (
              <div style={s.bidBars}>
                {myTenders.slice(0, 10).map(t => {
                  const pct = maxBids > 0 ? ((t.bid_count||0)/maxBids)*100 : 0;
                  const closed = isClosed(t); const done = t.status==='closed';
                  const color = done ? '#d4922a' : closed ? '#b91c1c' : '#16a34a';
                  return (
                    <div key={t.id} style={s.bidBarItem}>
                      <span style={s.bidBarLabel}>{t.tender_title?.length>18 ? t.tender_title.slice(0,18)+'…' : t.tender_title}</span>
                      <div style={s.bidBarTrack}>
                        <div style={{ ...s.bidBarFill, width:`${pct}%`, backgroundColor:color }} />
                      </div>
                      <span style={{ ...s.bidBarCount, color }}>{t.bid_count||0} bids</span>
                    </div>
                  );
                })}
                {myTenders.length > 10 && <p style={s.noData}>Showing latest 10 tenders.</p>}
              </div>
            )}
          </div>
        </>
      )}
    </ManufacturerLayout>
  );
}

const s = {
  pageHeader:   { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' },
  pageTitle:    { margin:'0 0 0.3rem', color:'#1a2e44', fontSize:'1.4rem', fontWeight:700 },
  pageSubtitle: { margin:0, color:'#64748b', fontSize:'0.9rem' },
  loading:      { textAlign:'center', color:'#64748b', padding:'4rem', fontSize:'1rem' },
  empty:        { textAlign:'center', padding:'5rem 2rem', color:'#94a3b8' },
  emptyIcon:    { fontSize:'3.5rem', marginBottom:'1rem' },
  emptyTitle:   { margin:'0 0 0.5rem', color:'#1a2e44', fontWeight:700, fontSize:'1.2rem' },
  emptyText:    { margin:0, fontSize:'0.95rem' },
  kpiGrid:      { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' },
  kpiCard:      { backgroundColor:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'1.25rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.3rem', textAlign:'center' },
  kpiIcon:      { fontSize:'1.5rem' },
  kpiVal:       { fontSize:'1.8rem', fontWeight:800, lineHeight:1.1 },
  kpiLabel:     { fontSize:'0.78rem', color:'#64748b', fontWeight:500 },
  row:          { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginBottom:'1.25rem' },
  panel:        { backgroundColor:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'1.5rem', marginBottom:'1.25rem' },
  panelTitle:   { margin:'0 0 1.25rem', color:'#1a2e44', fontWeight:700, fontSize:'1rem' },
  barRow:       { display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.85rem' },
  barLabel:     { minWidth:80, fontSize:'0.85rem', color:'#4a5568', fontWeight:500 },
  barTrack:     { flex:1, height:10, backgroundColor:'#f1f5f9', borderRadius:5, overflow:'hidden' },
  barFill:      { height:'100%', borderRadius:5, transition:'width 0.4s ease' },
  barCount:     { minWidth:80, fontSize:'0.82rem', fontWeight:600, textAlign:'right' },
  noData:       { color:'#94a3b8', fontSize:'0.875rem', margin:0 },
  bidBars:      { display:'flex', flexDirection:'column', gap:'0.7rem' },
  bidBarItem:   { display:'flex', alignItems:'center', gap:'0.75rem' },
  bidBarLabel:  { minWidth:140, fontSize:'0.82rem', color:'#4a5568', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  bidBarTrack:  { flex:1, height:14, backgroundColor:'#f1f5f9', borderRadius:5, overflow:'hidden' },
  bidBarFill:   { height:'100%', borderRadius:5, transition:'width 0.4s ease' },
  bidBarCount:  { minWidth:60, fontSize:'0.8rem', fontWeight:600, textAlign:'right' },
};