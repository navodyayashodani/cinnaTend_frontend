// src/components/Home.js
import React, { useEffect, useRef, useState } from 'react';

/* ─── Global styles (injected once) ─── */
const STYLE_ID = 'cin-home-styles';
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,700;0,9..144,900;1,9..144,700&family=Outfit:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green:    #27ae60;
      --green-dk: #1e8449;
      --green-lt: #d4efdf;
      --navy:     #2c3e50;
      --grey:     #7f8c8d;
      --bg:       #f5f6fa;
      --white:    #ffffff;
      --border:   #e0e0e0;
    }

    /* ── Keyframes ── */
    @keyframes heroFadeUp {
      from { opacity: 0; transform: translateY(40px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes heroScaleIn {
      from { opacity: 0; transform: scale(.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes spinSlow {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1);   opacity: .18; }
      50%       { transform: scale(1.1); opacity: .28; }
    }
    @keyframes dash {
      to { stroke-dashoffset: 0; }
    }
    @keyframes shimmerBar {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }
    @keyframes revealUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes countTick {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Hero text ── */
    .h-fade-1 { animation: heroFadeUp .8s cubic-bezier(.22,1,.36,1) .05s both; }
    .h-fade-2 { animation: heroFadeUp .8s cubic-bezier(.22,1,.36,1) .22s both; }
    .h-fade-3 { animation: heroFadeUp .8s cubic-bezier(.22,1,.36,1) .40s both; }
    .h-fade-4 { animation: heroFadeUp .8s cubic-bezier(.22,1,.36,1) .58s both; }
    .h-scale  { animation: heroScaleIn 1s cubic-bezier(.22,1,.36,1) .1s both; }

    /* ── CTA button ── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: .55rem;
      background: var(--green);
      color: #fff;
      border: none; border-radius: 3px;
      padding: .95rem 2.4rem;
      font-family: 'Outfit', sans-serif;
      font-weight: 600; font-size: .95rem;
      letter-spacing: .04em; text-transform: uppercase;
      cursor: pointer;
      position: relative; overflow: hidden;
      transition: background .25s, transform .2s, box-shadow .25s;
    }
    .btn-primary::after {
      content: '';
      position: absolute; top: 0; left: -60%;
      width: 40%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
      animation: shimmerBar 2.6s ease-in-out infinite;
    }
    .btn-primary:hover {
      background: var(--green-dk);
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(39,174,96,.35);
    }

    .btn-outline {
      display: inline-flex; align-items: center; gap: .5rem;
      background: transparent;
      color: var(--navy);
      border: 1.5px solid var(--navy);
      border-radius: 3px;
      padding: .95rem 2.4rem;
      font-family: 'Outfit', sans-serif;
      font-weight: 500; font-size: .95rem;
      letter-spacing: .04em; text-transform: uppercase;
      cursor: pointer;
      transition: background .22s, color .22s;
    }
    .btn-outline:hover { background: var(--navy); color: #fff; }

    /* ── Feature cards ── */
    .feat-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2.2rem;
      transition: transform .28s, box-shadow .28s, border-color .28s;
      position: relative; overflow: hidden;
    }
    .feat-card::before {
      content: '';
      position: absolute; top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--green);
      transform: scaleX(0); transform-origin: left;
      transition: transform .35s cubic-bezier(.22,1,.36,1);
    }
    .feat-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(44,62,80,.12); border-color: transparent; }
    .feat-card:hover::before { transform: scaleX(1); }

    /* ── Step cards ── */
    .step-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2.2rem;
      transition: box-shadow .25s, transform .25s;
    }
    .step-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(44,62,80,.1); }

    /* ── Why cards ── */
    .why-card {
      background: var(--white);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1.8rem;
      display: flex; flex-direction: column; gap: .55rem;
      transition: transform .25s, box-shadow .25s;
    }
    .why-card:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(44,62,80,.1); }

    /* ── Stat cards ── */
    .stat-item {
      text-align: center;
      padding: 2rem 1rem;
      border-right: 1px solid var(--border);
      animation: countTick .6s ease both;
    }
    .stat-item:last-child { border-right: none; }

    /* ── Footer links ── */
    .f-link { transition: color .2s !important; }
    .f-link:hover { color: var(--green) !important; }

    /* ── Diagonal divider ── */
    .diag-divider {
      width: 100%; overflow: hidden; line-height: 0;
      margin-top: -1px;
    }
    .diag-divider svg { display: block; }
  `;
  document.head.appendChild(s);
}

/* ─── Scroll-reveal hook ─── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVis(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, vis];
}

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, vis] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity .75s ease ${delay}s, transform .75s cubic-bezier(.22,1,.36,1) ${delay}s`,
      ...style
    }}>
      {children}
    </div>
  );
}

/* ─── Label pill ─── */
function Pill({ text }) {
  return (
    <span style={{
      display: 'inline-block',
      background: 'var(--green-lt)',
      color: 'var(--green-dk)',
      borderRadius: '20px',
      padding: '.3rem 1rem',
      fontSize: '.72rem',
      fontWeight: 600,
      letterSpacing: '.1em',
      textTransform: 'uppercase',
      marginBottom: '1rem',
    }}>{text}</span>
  );
}

/* ════════════════════════════
   MAIN COMPONENT
════════════════════════════ */
export default function Home({ onRegisterClick }) {
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", backgroundColor: 'var(--bg)', color: 'var(--navy)', minHeight: '100vh' }}>

      {/* ══ HERO ══ */}
      <section style={{
        position: 'relative',
        backgroundColor: 'var(--white)',
        overflow: 'hidden',
        padding: '6rem 2rem 5rem',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* bg dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(44,62,80,.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* green blob top-right */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(39,174,96,.13) 0%, transparent 70%)',
          animation: 'pulse 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        {/* spinning ring */}
        <svg style={{ position: 'absolute', bottom: '5%', left: '3%', opacity: .1, animation: 'spinSlow 30s linear infinite', pointerEvents: 'none' }} width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="#27ae60" strokeWidth="1.5" strokeDasharray="12 8" />
          <circle cx="100" cy="100" r="68" fill="none" stroke="#27ae60" strokeWidth=".8" strokeDasharray="6 12" />
        </svg>

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div className="h-fade-1">
            <Pill text="Ceylon's #1 Cinnamon Oil Marketplace" />
          </div>

          <h1 className="h-fade-2" style={{
            
            fontSize: 'clamp(2.6rem, 6.5vw, 5.2rem)',
            fontWeight: 900,
            lineHeight: 1.07,
            color: 'var(--navy)',
            marginBottom: '1.5rem',
            letterSpacing: '-.02em',
          }}>
            The Smarter Way to<br />
            <span style={{
              color: 'var(--green)',
              position: 'relative',
              display: 'inline-block',
            }}>
              Trade Cinnamon Oil
              {/* underline squiggle */}
              <svg style={{ position: 'absolute', bottom: '-8px', left: 0, width: '100%', height: 8 }} viewBox="0 0 300 8" preserveAspectRatio="none">
                <path d="M0,5 Q37,0 75,5 Q112,10 150,5 Q187,0 225,5 Q262,10 300,5" fill="none" />
              </svg>
            </span>
          </h1>

          <p className="h-fade-3" style={{
            fontSize: '1.1rem',
            color: 'var(--grey)',
            lineHeight: 1.8,
            maxWidth: 540,
            margin: '0 auto 2.6rem',
            fontWeight: 300,
          }}>
            Connect certified Sri Lankan manufacturers with global buyers on a transparent, AI-assisted tendering platform built for serious trade.
          </p>

          <div className="h-fade-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={onRegisterClick}>
              Get Started →
            </button>
            
          </div>

          {/* trust bar */}
          <div className="h-fade-4" style={{
            marginTop: '3.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '1.5rem', flexWrap: 'wrap',
            fontSize: '.82rem', color: 'var(--grey)', letterSpacing: '.04em',
          }}>
            {['✓ Free to Register', '✓ KYB-Verified Traders', '✓ AI-Powered Matching', '✓ Secure Escrow'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS STRIP ══ */}
      <section style={{ backgroundColor: 'var(--navy)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { num: '1,200+', label: 'Verified Traders' },
            { num: '48 hrs', label: 'Avg. Deal Closure' },
            { num: '$42M+', label: 'Trade Volume' },
            { num: '38', label: 'Export Countries' },
          ].map((s, i) => (
            <Reveal key={s.num} delay={i * 0.09}>
              <div className="stat-item" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                <div style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '2.4rem', fontWeight: 900, lineHeight: 1,
                  color: 'var(--green)',
                }}>{s.num}</div>
                <div style={{ fontSize: '.8rem', color: 'rgba(255,255,255,.5)', marginTop: '.45rem', letterSpacing: '.08em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══ FEATURE CARDS ══ */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <Pill text="Platform" />
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem,3.5vw,2.8rem)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
              Built for Every Side of the Trade
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>
            {[
              { icon: '🏭', title: 'For Manufacturers', text: 'List certified batches, set reserve prices, manage inventory in real time, and receive qualified tender bids directly in your dashboard.' },
              { icon: '🛒', title: 'For Buyers', text: 'Browse graded stock from verified distillers, compare quality specs side-by-side, and submit competitive tenders with full confidence.' },
              { icon: '🤖', title: 'AI-Powered Matching', text: 'Our engine analyses preferences and market signals to surface the most relevant counterparties — cutting discovery time in half.' },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.13}>
                <div className="feat-card">
                  <div style={{
                    width: 52, height: 52, borderRadius: '12px',
                    background: 'var(--green-lt)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.6rem', marginBottom: '1.3rem',
                  }}>{c.icon}</div>
                  <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '.6rem' }}>{c.title}</h3>
                  <p style={{ color: 'var(--grey)', lineHeight: 1.75, fontSize: '.93rem' }}>{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ backgroundColor: 'var(--navy)', padding: '6rem 2rem', position: 'relative', overflow: 'hidden' }}>
        {/* subtle grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Reveal style={{ marginBottom: '3.5rem' }}>
            <Pill text="Process" />
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem,3.5vw,2.8rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              Three Steps to Your First Deal
            </h2>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {[
              { n: '01', title: 'Register & Verify', text: 'Create your account and submit business credentials. Our compliance team verifies you within 24 hours.' },
              { n: '02', title: 'List or Discover', text: 'Post batches with grade certificates, or search listings filtered by purity, volume, origin, and price.' },
              { n: '03', title: 'Tender & Close', text: 'Bid, negotiate, and finalise terms inside the platform. Escrow and digital contracts protect every deal.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 0.15}>
                <div className="step-card" style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px', padding: '2.2rem' }}>
                  <div style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: '3.8rem', fontWeight: 900, lineHeight: 1,
                    color: 'var(--green)', opacity: .9,
                    marginBottom: '.6rem',
                  }}>{s.n}</div>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', color: '#fff', marginBottom: '.6rem' }}>{s.title}</h4>
                  <p style={{ color: 'rgba(255,255,255,.5)', lineHeight: 1.75, fontSize: '.92rem', margin: 0 }}>{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* diagonal break */}
      <div className="diag-divider" style={{ backgroundColor: 'var(--navy)', marginBottom: '-1px' }}>
        <svg viewBox="0 0 1440 48" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
          <path d="M0,0 L1440,48 L1440,48 L0,48 Z" fill="var(--bg)" />
        </svg>
      </div>

      {/* ══ WHY CHOOSE US ══ */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <Pill text="Advantages" />
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem,3.5vw,2.8rem)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.2 }}>
              Why the Industry Trusts Us
            </h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.25rem' }}>
            {[
              { icon: '🔒', label: 'Verified Participants', text: 'Full KYB on every account eliminates fraud and protects your reputation.' },
              { icon: '📊', label: 'Real-Time Market Data', text: 'Benchmark pricing updated daily so you always know fair market value.' },
              { icon: '🌿', label: 'Quality Grading', text: 'ISO-aligned grade standards make cross-supplier comparison effortless.' },
              { icon: '⚡', label: 'Fast Matching', text: 'Relevant counterparties surfaced in seconds, not days of cold outreach.' },
              { icon: '🌐', label: 'Global Reach', text: 'Active buyers across Europe, Middle East, North America, and Asia-Pacific.' },
              { icon: '🛡️', label: 'Dispute Support', text: 'Neutral arbitration and escrow ensure fair outcomes for all parties.' },
            ].map((w, i) => (
              <Reveal key={w.label} delay={(i % 3) * 0.1}>
                <div className="why-card">
                  <div style={{
                    width: 44, height: 44, borderRadius: '10px',
                    background: 'var(--green-lt)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.35rem',
                  }}>{w.icon}</div>
                  <h4 style={{ fontFamily: "'Fraunces', serif", fontSize: '1rem', fontWeight: 700, color: 'var(--navy)' }}>{w.label}</h4>
                  <p style={{ color: 'var(--grey)', lineHeight: 1.65, fontSize: '.9rem', margin: 0 }}>{w.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section style={{
        margin: '0 2rem 5rem',
        maxWidth: 1200,
        marginLeft: 'auto', marginRight: 'auto',
      }}>
        <Reveal>
          <div style={{
            background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dk) 100%)',
            borderRadius: '12px',
            padding: 'clamp(3rem,5vw,4.5rem) clamp(2rem,5vw,5rem)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '2rem',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* decorative circles */}
            <div style={{ position: 'absolute', right: '-40px', top: '-60px', width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: '60px', bottom: '-80px', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.7rem,3vw,2.5rem)', fontWeight: 900, color: '#fff', marginBottom: '.6rem', lineHeight: 1.2 }}>
                Ready to Trade with Confidence?
              </h2>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1rem', maxWidth: 440, lineHeight: 1.7 }}>
                Join 1,200+ verified traders already closing better deals, faster.
              </p>
            </div>

            <button onClick={onRegisterClick} style={{
              position: 'relative', zIndex: 1,
              background: '#fff', color: 'var(--green-dk)',
              border: 'none', borderRadius: '3px',
              padding: '1rem 2.6rem',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700, fontSize: '1rem',
              letterSpacing: '.04em', textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'transform .2s, box-shadow .2s',
              flexShrink: 0,
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.2)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              Create Free Account →
            </button>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ backgroundColor: 'var(--navy)', paddingTop: '3.5rem', borderTop: '1px solid rgba(255,255,255,.06)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 3rem', display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr', gap: '3rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', marginBottom: '1rem' }}>
              🌿 CinnamonOil
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: '.88rem', lineHeight: 1.75, maxWidth: 260, marginBottom: '1.5rem' }}>
              The trusted tendering platform for the global cinnamon oil industry — connecting Ceylon's finest distillers with international buyers.
            </p>
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
              {['LinkedIn', 'Twitter', 'Email'].map(l => (
                <a key={l} href="#" style={{ fontSize: '.72rem', letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', border: '1px solid rgba(255,255,255,.12)', padding: '.35rem .85rem', borderRadius: '3px', textDecoration: 'none', transition: 'color .2s, border-color .2s' }}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.borderColor = 'var(--green)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.78)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.82)'; }}
                >{l}</a>
              ))}
            </div>
          </div>

          {[
            { title: 'Platform', links: ['Browse Listings', 'Submit a Tender', 'Pricing', 'API Access'] },
            { title: 'Company',  links: ['About Us', 'Blog', 'Careers', 'Contact'] },
            { title: 'Legal',    links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Compliance'] },
          ].map(col => (
            <div key={col.title}>
              <h5 style={{ fontSize: '.7rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '1.1rem', fontWeight: 600 }}>{col.title}</h5>
              {col.links.map(l => (
                <a key={l} className="f-link" href="#" style={{ display: 'block', fontSize: '.88rem', color: 'rgba(255, 255, 255, 0.75)', textDecoration: 'none', marginBottom: '.6rem' }}>{l}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', padding: '1.3rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', maxWidth: 1200, margin: '0 auto', fontSize: '.78rem', color: 'rgba(255, 255, 255, 0.78)', letterSpacing: '.04em' }}>
          <span>© {new Date().getFullYear()} CinnamonOil Tendering System. All rights reserved.</span>
          <span>Crafted with care in Sri Lanka 🇱🇰</span>
        </div>
      </footer>

    </div>
  );
}