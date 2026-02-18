// src/pages/manufacturer/QualityGradingPage.jsx

import React from 'react';
import ManufacturerLayout from '../../components/ManufacturerLayout';

export default function QualityGradingPage() {
  const grades = [
    { grade:'A+', label:'Premium',  color:'#16a34a', bg:'#f0fdf4', desc:'Exceptional quality. Highest market value.' },
    { grade:'A',  label:'Excellent',color:'#15803d', bg:'#dcfce7', desc:'Superior quality. Above standard requirements.' },
    { grade:'B',  label:'Good',     color:'#d97706', bg:'#fffbeb', desc:'Meets all standard quality requirements.' },
    { grade:'C',  label:'Average',  color:'#b45309', bg:'#fef3c7', desc:'Meets minimum quality requirements.' },
    { grade:'D',  label:'Below Avg',color:'#b91c1c', bg:'#fef2f2', desc:'Below standard. Requires improvement.' },
  ];

  return (
    <ManufacturerLayout>
      <div style={s.pageHeader}>
        <div>
          <h2 style={s.pageTitle}>Quality Grading</h2>
          <p style={s.pageSubtitle}>Understand quality grades assigned to your tender reports</p>
        </div>
      </div>

      {/* Info banner */}
      <div style={s.infoBanner}>
        <span style={s.infoIcon}>⭐</span>
        <div>
          <p style={s.infoTitle}>Automatic Quality Analysis</p>
          <p style={s.infoText}>When you upload a lab report with your tender, our AI model automatically analyses it and assigns a quality grade. The grade reflects chemical composition, purity, and compliance with industry standards.</p>
        </div>
      </div>

      {/* Grade cards */}
      <div style={s.sectionLabelRow}>
        <span style={s.sectionLabel}>Grading Scale</span>
      </div>

      <div style={s.gradeGrid}>
        {grades.map(g => (
          <div key={g.grade} style={{ ...s.gradeCard, backgroundColor: g.bg, border: `2px solid ${g.color}22` }}>
            <div style={{ ...s.gradeBadge, backgroundColor: g.color }}>{g.grade}</div>
            <p style={{ ...s.gradeLabel, color: g.color }}>{g.label}</p>
            <p style={s.gradeDesc}>{g.desc}</p>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={s.sectionLabelRow}>
        <span style={s.sectionLabel}>How It Works</span>
      </div>

      <div style={s.stepsGrid}>
        {[
          { step:'1', icon:'📄', title:'Upload Report',    desc:'Attach your lab analysis report when creating a tender (PDF, DOCX, XLS, or image).' },
          { step:'2', icon:'🤖', title:'AI Analysis',      desc:'Our ML model extracts chemical composition data and cross-references industry benchmarks.' },
          { step:'3', icon:'⭐', title:'Grade Assigned',   desc:'A quality grade (A+ to D) is automatically calculated and attached to your tender.' },
          { step:'4', icon:'👀', title:'Buyers See Grade', desc:'Buyers can view the grade when placing bids, helping them make informed decisions.' },
        ].map(step => (
          <div key={step.step} style={s.stepCard}>
            <div style={s.stepNum}>{step.step}</div>
            <div style={s.stepIcon}>{step.icon}</div>
            <p style={s.stepTitle}>{step.title}</p>
            <p style={s.stepDesc}>{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Coming soon notice */}
      <div style={s.comingSoon}>
        <span style={s.comingIcon}>🚧</span>
        <div>
          <p style={s.comingTitle}>Detailed Grade Reports Coming Soon</p>
          <p style={s.comingText}>A full breakdown of each tender's quality analysis, chemical properties, and grading rationale will be available here in a future update.</p>
        </div>
      </div>
    </ManufacturerLayout>
  );
}

const s = {
  pageHeader:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem' },
  pageTitle:     { margin:'0 0 0.3rem', color:'#1a2e44', fontSize:'1.4rem', fontWeight:700 },
  pageSubtitle:  { margin:0, color:'#64748b', fontSize:'0.9rem' },
  infoBanner:    { display:'flex', gap:'1rem', alignItems:'flex-start', backgroundColor:'#eff6ff', border:'2px solid #bfdbfe', borderRadius:10, padding:'1.25rem 1.5rem', marginBottom:'1.75rem' },
  infoIcon:      { fontSize:'1.75rem', flexShrink:0 },
  infoTitle:     { margin:'0 0 0.3rem', fontWeight:700, color:'#1e40af', fontSize:'0.95rem' },
  infoText:      { margin:0, color:'#3b82f6', fontSize:'0.875rem', lineHeight:1.6 },
  sectionLabelRow:{ display:'flex', alignItems:'baseline', gap:'0.6rem', marginBottom:'0.75rem', flexWrap:'wrap' },
  sectionLabel:  { fontSize:'0.875rem', fontWeight:700, color:'#1a2e44' },
  gradeGrid:     { display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'1rem', marginBottom:'2rem' },
  gradeCard:     { borderRadius:10, padding:'1.25rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', textAlign:'center' },
  gradeBadge:    { width:48, height:48, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'1.1rem' },
  gradeLabel:    { margin:'0.3rem 0 0', fontWeight:700, fontSize:'0.875rem' },
  gradeDesc:     { margin:0, fontSize:'0.78rem', color:'#64748b', lineHeight:1.5 },
  stepsGrid:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'2rem' },
  stepCard:      { backgroundColor:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'1.25rem', display:'flex', flexDirection:'column', alignItems:'center', gap:'0.4rem', textAlign:'center' },
  stepNum:       { width:28, height:28, borderRadius:'50%', backgroundColor:'#d4922a', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:'0.85rem', flexShrink:0 },
  stepIcon:      { fontSize:'1.75rem', margin:'0.35rem 0' },
  stepTitle:     { margin:0, fontWeight:700, color:'#1a2e44', fontSize:'0.9rem' },
  stepDesc:      { margin:0, fontSize:'0.8rem', color:'#64748b', lineHeight:1.5 },
  comingSoon:    { display:'flex', gap:'1rem', alignItems:'flex-start', backgroundColor:'#fefce8', border:'2px solid #fde047', borderRadius:10, padding:'1.25rem 1.5rem' },
  comingIcon:    { fontSize:'1.75rem', flexShrink:0 },
  comingTitle:   { margin:'0 0 0.3rem', fontWeight:700, color:'#713f12', fontSize:'0.95rem' },
  comingText:    { margin:0, color:'#854d0e', fontSize:'0.875rem', lineHeight:1.6 },
};