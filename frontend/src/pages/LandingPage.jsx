import React, { useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Wind, GraduationCap, Waves, Shield, Map,
  Trees, BarChart3,
  MapPin, Database, LayoutGrid, Star, Users,
  AlertTriangle,
  Award, ArrowRight, CheckCircle
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProfileSelector from '../components/ProfileSelector';
import HeatMap from '../components/HeatMap';

const SAMPLE_AREAS = ['Wakad', 'Baner', 'Kothrud', 'Hinjewadi', 'Koregaon Park'];

// Static preview data — hardcoded Baner sample, no API call
const PREVIEW_DIMS = [
  { label: 'School Quality', emoji: '🏫', score: 80 },
  { label: 'Air Quality', emoji: '🌬️', score: 100 },
  { label: 'Healthcare', emoji: '🏥', score: 72 },
  { label: 'Crime Safety', emoji: '🛡️', score: 65 },
];

function getBarColor(score) {
  if (score >= 80) return '#3FB950';
  if (score >= 60) return '#E6A817';
  return '#F85149';
}

// Static SVG gauge for the preview card
function StaticGauge({ score, size = 88 }) {
  const r = 32, cx = 44, cy = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = getBarColor(score);
  return (
    <svg width={size} height={size} viewBox="0 0 88 88">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={7} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={7} strokeLinecap="round"
        strokeDasharray={`${filled} ${circ}`}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="20" fontWeight="800" fontFamily="DM Sans, sans-serif">
        {score}
      </text>
    </svg>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' } }
};

const stagger = { animate: { transition: { staggerChildren: 0.09 } } };

const inView = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

const sectionLabelStyle = {
  fontSize: 12,
  color: 'var(--accent)',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 16
};

const sectionHeadingStyle = {
  fontFamily: 'var(--font-heading)',
  fontSize: 'clamp(36px, 4.4vw, 48px)',
  fontWeight: 700,
  color: '#1A1A2E',
  letterSpacing: '-0.03em',
  lineHeight: 1.15
};

function AnimatedStat({ num, label, Icon, index }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [value, setValue] = React.useState(0);

  const isFloat = num.includes('.');
  const hasPlus = num.includes('+');
  const target = parseFloat(num.replace(/,/g, '').replace('+', ''));
  
  const duration = index === 0 ? 1200 : index === 1 ? 1500 : 2000;
  
  React.useEffect(() => {
    if (isInView) {
      const start = performance.now();
      let rafId;
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(target * eased);
        if (progress < 1) rafId = requestAnimationFrame(update);
        else setValue(target);
      }
      rafId = requestAnimationFrame(update);
      return () => cancelAnimationFrame(rafId);
    }
  }, [isInView, target, duration]);

  let displayStr = isFloat 
    ? value.toFixed(1) 
    : Math.floor(value).toLocaleString('en-IN');
  
  if (hasPlus && value === target) displayStr += '+';

  return (
    <motion.div 
      ref={ref}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.2 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
        <Icon size={28} color="#6366F1" strokeWidth={1.5} />
      </div>
      <div style={{
        fontSize: 'clamp(56px, 7vw, 80px)',
        fontWeight: 800,
        fontFamily: 'var(--font-heading)',
        color: 'var(--accent)',
        letterSpacing: '-0.03em',
        lineHeight: 1
      }}>
        {displayStr}
      </div>
      <div style={{ fontSize: 14, color: '#94A3B8', marginTop: 12, letterSpacing: '0.02em' }}>{label}</div>
    </motion.div>
  );
}

function LandingPage({ onSearch, error, selectedProfile, onProfileChange }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (lat, lng, name) => {
    setIsLoading(true);
    onSearch(lat, lng, name, selectedProfile);
  };

  const handleHeatMapClick = ({ lat, lng, name }) => {
    setIsLoading(true);
    onSearch(lat, lng, name, selectedProfile);
  };

  const handleChipClick = (areaName) => {
    if (!window.google) return;
    setIsLoading(true);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: `${areaName}, Pune, Maharashtra, India` }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location;
        onSearch(loc.lat(), loc.lng(), results[0].formatted_address, selectedProfile);
      } else {
        setIsLoading(false);
      }
    });
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', position: 'relative' }}>
      {/* Background Blobs */}
      <div className="blob-container" style={{ 
        position: 'fixed', 
        inset: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none',
        zIndex: 0 
      }}>
        {/* Blob 1 — Indigo, top left */}
        <motion.div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            top: '-200px',
            left: '-200px',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 30, -10, 0],
            scale: [1, 1.05, 0.97, 1.03, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Blob 2 — Amber, top right */}
        <motion.div
          style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,168,23,0.14) 0%, transparent 70%)',
            top: '-150px',
            right: '-150px',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, -25, 15, -10, 0],
            y: [0, 20, -30, 15, 0],
            scale: [1, 0.97, 1.05, 0.98, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        
        {/* Blob 3 — Green, bottom center */}
        <motion.div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)',
            bottom: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 20, -20, 10, 0],
            y: [0, -15, 20, -10, 0],
            scale: [1, 1.08, 0.95, 1.04, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
        />
      </div>

      {/* ── SECTION 1 — HERO (full-bleed background) ── */}
      <section className="grid-bg" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        {/* Nav */}
        <div className="hero-nav-inner">
          <span style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22,
            fontWeight: 700,
            color: '#1A1A2E',
            letterSpacing: '-0.02em'
          }}>
            <span style={{ color: 'var(--accent)' }}>N</span>eighbourScore
          </span>
          <span style={{
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            fontSize: 12,
            fontWeight: 500,
            padding: '5px 12px',
            borderRadius: 100,
            border: '1px solid var(--accent-border)',
            whiteSpace: 'nowrap',
            flexShrink: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '50vw'
          }}>
            Google Solution Challenge 2026
          </span>
        </div>

        {/* Hero content */}
        <div className="hero-content-wrap">
          <div className="section-inner">
            <div className="hero-grid">
              {/* Left: headline + search */}
              <motion.div variants={stagger} initial="initial" animate="animate">
                {/* Announcement pill */}
                <motion.div variants={fadeUp} style={{ marginBottom: 32 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 9,
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 100,
                    padding: '7px 18px',
                    fontSize: 13,
                    color: 'var(--accent)',
                    fontWeight: 500,
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--accent)', display: 'inline-block',
                      flexShrink: 0,
                      animation: 'pulse-dot 2s ease-in-out infinite'
                    }} />
                    <Award size={14} color="var(--accent)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Ranked #1 Real Estate tool on Razorpay Fix My Itch · 94.5/100
                    </span>
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  variants={fadeUp}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(32px, 5.2vw, 64px)',
                    fontWeight: 700,
                    lineHeight: 1.08,
                    letterSpacing: '-0.03em',
                    marginBottom: 24,
                    color: '#1A1A2E'
                  }}
                >
                  The credit score<br />
                  <span style={{
                    color: 'var(--accent)',
                    fontStyle: 'italic'
                  }}>
                    for neighborhoods.
                  </span>
                </motion.h1>

                {/* Subtext */}
                <motion.p
                  variants={fadeUp}
                  style={{
                    fontSize: 17,
                    color: '#94A3B8',
                    lineHeight: 1.78,
                    marginBottom: 36,
                    maxWidth: 540,
                    width: '100%'
                  }}
                >
                  Indian homebuyers spend months researching localities with no structured data.
                  NeighbourScore gives you an objective, AI-powered report card for any locality
                  in Pune — built from CPCB, CBSE, NDMA, and NCRB government data.
                </motion.p>

                {/* Search bar */}
                <motion.div variants={fadeUp} style={{ marginBottom: 0 }}>
                  <SearchBar onSearch={handleSearch} isLoading={isLoading} />
                </motion.div>

                {/* Profile selector */}
                <motion.div variants={fadeUp}>
                  <ProfileSelector
                    selectedProfile={selectedProfile}
                    onProfileChange={onProfileChange}
                  />
                </motion.div>

                {/* Error */}
                {error && (
                  <p style={{ fontSize: 13, color: 'var(--score-red)', marginBottom: 10 }}>{error}</p>
                )}

                {/* Chips */}
                <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Try:</span>
                  {SAMPLE_AREAS.map(area => (
                    <button
                      key={area}
                      onClick={() => handleChipClick(area)}
                      className="glass-chip"
                      style={{
                        fontSize: 13,
                        padding: '6px 15px',
                        borderRadius: 100,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                        e.currentTarget.style.color = '#6366F1';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.9)';
                        e.currentTarget.style.color = '#64748B';
                      }}
                    >
                      {area}
                    </button>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right: static preview card */}
              <motion.div
                className="hero-preview"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
              >
                <div className="glass-card" style={{
                  padding: '28px',
                }}>
                  {/* Preview header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 22,
                    paddingBottom: 18,
                    borderBottom: '1px solid var(--border)'
                  }}>
                    <span style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Sample report
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>Baner, Pune</span>
                  </div>

                  {/* Score row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 26 }}>
                    <StaticGauge score={81} />
                    <div>
                      <div style={{
                        fontSize: 10,
                        color: '#64748B',
                        marginBottom: 2,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase'
                      }}>
                        NeighbourScore
                      </div>
                      <div style={{
                        fontSize: 48,
                        fontWeight: 800,
                        fontFamily: 'var(--font-heading)',
                        color: '#3FB950',
                        lineHeight: 1
                      }}>
                        81
                        <span style={{ fontSize: 18, fontWeight: 400, color: '#64748B' }}>/100</span>
                      </div>
                      <div style={{
                        display: 'inline-block',
                        marginTop: 6,
                        background: 'var(--secondary-soft)',
                        color: '#3FB950',
                        border: '1px solid rgba(63,185,80,0.25)',
                        padding: '2px 12px',
                        borderRadius: 100,
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        Excellent Neighborhood
                      </div>
                    </div>
                  </div>

                  {/* Dimension bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {PREVIEW_DIMS.map(({ label, emoji, score }) => (
                      <div key={label}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6
                        }}>
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>
                            {emoji} {label}
                          </span>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: getBarColor(score)
                          }}>
                            {score}
                          </span>
                        </div>
                        <div style={{
                          height: 5,
                          background: 'rgba(0,0,0,0.06)',
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${score}%`,
                            background: getBarColor(score),
                            borderRadius: 3
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop: 20,
                    padding: '10px 14px',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 10,
                    fontSize: 11,
                    color: 'var(--accent)'
                  }}>
                    AI Analysis · Powered by Gemini 1.5 Flash — based on CPCB, CBSE, NDMA & NCRB data
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2 — PUNE HEAT MAP ── */}
      <section style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div className="section-inner">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={sectionLabelStyle}>Explore Pune</p>
              <h2 style={sectionHeadingStyle}>Pune at a glance</h2>
              <p style={{
                fontSize: 16,
                color: '#94A3B8',
                marginTop: 14,
                lineHeight: 1.65,
                maxWidth: 480,
                margin: '14px auto 0',
              }}>
                Every neighborhood scored. Click any area to analyze.
              </p>
            </div>

            <div className="heatmap-wrap">
              <HeatMap onLocalityClick={handleHeatMapClick} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3 — PROBLEM WE SOLVE ── */}
      <section className="section-pad">
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <motion.div {...inView}>
              <p style={sectionLabelStyle}>The Problem</p>
              <h2 style={sectionHeadingStyle}>
                A ₹1 crore decision<br />made with zero data.
              </h2>
            </motion.div>
          </div>

          <div className="problem-grid">
            {[
              {
                Icon: Wind,
                title: 'Air quality? Check a separate website.',
                body: 'CPCB publishes hourly AQI data for 800+ monitoring stations across India. No housing platform has ever integrated this into a locality decision. Until now.'
              },
              {
                Icon: GraduationCap,
                title: 'Schools? Look them up one by one.',
                body: '20,367 CBSE-affiliated schools are publicly registered with board results. No platform tells you which are within 3km of your future home — until now.'
              },
              {
                Icon: Waves,
                title: 'Flood risk? Nobody tells you.',
                body: 'NDMA publishes flood hazard zone shapefiles for every district. Developers never mention them. NeighbourScore surfaces this data automatically for every search.'
              }
            ].map(({ Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="glass-card"
                style={{
                  padding: '32px'
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(99,102,241,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 22
                }}>
                  <Icon size={24} color="#6366F1" strokeWidth={1.5} />
                </div>
                <h3 style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#1A1A2E',
                  marginBottom: 12,
                  lineHeight: 1.35,
                  letterSpacing: '-0.01em'
                }}>
                  {title}
                </h3>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.7 }}>
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS ── */}
      <section className="section-pad">
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <motion.div {...inView}>
              <p style={sectionLabelStyle}>How It Works</p>
              <h2 style={sectionHeadingStyle}>
                Three steps. Eight dimensions. One score.
              </h2>
            </motion.div>
          </div>

          <div className="steps-grid">
            {[
              {
                num: '01',
                title: 'Search any locality in Pune',
                body: 'Type a locality name or housing society. Google Maps autocomplete finds the exact coordinates instantly — no manual entry needed.',
                Icon: MapPin
              },
              {
                num: '02',
                title: 'We fetch data from 8 government sources',
                body: 'CPCB air quality, CBSE school results, NDMA flood maps, NCRB crime data, Google Maps — all queried in parallel in under 3 seconds.',
                Icon: Database
              },
              {
                num: '03',
                title: 'Get your NeighbourScore report card',
                body: 'An overall score out of 100, 8 dimension scores with progress bars, and Gemini-powered plain English explanations for each dimension.',
                Icon: BarChart3
              }
            ].map(({ num, title, body, Icon }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.12 }}
                style={{ position: 'relative' }}
              >
                <div style={{
                  fontSize: 72,
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: 'rgba(26,26,46,0.3)',
                  lineHeight: 1,
                  marginBottom: 24,
                  letterSpacing: '-0.04em'
                }}>
                  {num}
                </div>
                <h3 style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#1A1A2E',
                  marginBottom: 6,
                  lineHeight: 1.3,
                  letterSpacing: '-0.015em'
                }}>
                  {title}
                </h3>
                <div style={{ marginBottom: 12 }}>
                  <Icon size={20} color="#6366F1" strokeWidth={1.5} />
                </div>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.72 }}>
                  {body}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
                  <div style={{ width: 24, height: 2, background: 'var(--accent)', borderRadius: 1 }} />
                  <ArrowRight size={13} color="var(--accent)" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — DATA SOURCES ── */}
      <section className="section-pad">
        <div className="section-inner">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <motion.div {...inView}>
              <p style={sectionLabelStyle}>Data Sources</p>
              <h2 style={{ ...sectionHeadingStyle, marginBottom: 14 }}>
                Built on verified government data. Not opinions.
              </h2>
              <p style={{ fontSize: 16, color: '#94A3B8', maxWidth: 620, margin: '0 auto', lineHeight: 1.7 }}>
                Every score is computed from primary sources — the same data that researchers and policymakers use.
              </p>
            </motion.div>
          </div>

          <div className="sources-grid">
            {[
              { Icon: Wind, name: 'CPCB', sub: 'Live AQI · Updated hourly', detail: 'Central Pollution Control Board' },
              { Icon: GraduationCap, name: 'CBSE', sub: '20,367 schools · Board results', detail: 'Central Board of Secondary Education' },
              { Icon: AlertTriangle, name: 'NDMA', sub: 'Flood hazard zones · Shapefile data', detail: 'National Disaster Management Authority' },
              { Icon: Shield, name: 'NCRB', sub: 'Crime in India 2023 · District level', detail: 'National Crime Records Bureau' },
              { Icon: Map, name: 'Google Maps', sub: 'Places API · Hospitals & Transport', detail: 'Google Maps Platform' },
              { Icon: Trees, name: 'OpenStreetMap', sub: 'Parks & greenery data', detail: 'Open source geospatial data' },
            ].map(({ Icon, name, sub, detail }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="glass-card"
                style={{
                  padding: '28px'
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: 'rgba(99,102,241,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18
                }}>
                  <Icon size={20} color="#6366F1" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginBottom: 8, fontWeight: 500 }}>{sub}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{detail}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — FINAL CTA ── */}
      <section className="section-pad">
        <motion.div {...inView}>
          <div className="section-inner">
            {/* Stats strip — enormous amber numbers spread across full width */}
            <div className="stats-strip">
              {[
                { num: '8', label: 'Data dimensions', Icon: LayoutGrid },
                { num: '94.5', label: 'Razorpay Fix My Itch score', Icon: Star },
                { num: '50,000+', label: 'Indians validated this', Icon: Users },
              ].map((item, i) => (
                <AnimatedStat key={item.label} {...item} index={i} />
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <h2 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 700,
                color: '#1A1A2E',
                letterSpacing: '-0.03em',
                marginBottom: 18,
                lineHeight: 1.1
              }}>
                Know before you move.
              </h2>
              <p style={{ fontSize: 17, color: '#94A3B8', marginBottom: 40, lineHeight: 1.7 }}>
                Join thousands of Indian families making data-backed housing decisions.
              </p>

              <div style={{ maxWidth: 620, width: '100%', margin: '0 auto 22px' }}>
                <SearchBar onSearch={handleSearch} isLoading={isLoading} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', padding: '0 16px' }}>
                {['Free', 'No signup required', 'Pune only for now'].map(t => (
                  <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94A3B8' }}>
                    <CheckCircle size={13} color="var(--text-muted)" /> {t}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div style={{ marginTop: 80, paddingTop: 36, borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span>Data sourced from</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Wind size={12} strokeWidth={1.5} color="#94A3B8" /> CPCB</span> ·
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><GraduationCap size={12} strokeWidth={1.5} color="#94A3B8" /> CBSE</span> ·
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} strokeWidth={1.5} color="#94A3B8" /> NDMA</span> ·
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={12} strokeWidth={1.5} color="#94A3B8" /> NCRB</span> ·
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Map size={12} strokeWidth={1.5} color="#94A3B8" /> Google Maps</span>
                </p>
                <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.3)', marginTop: 8 }}>
                  NeighbourScore · Google Solution Challenge 2026
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default LandingPage;
