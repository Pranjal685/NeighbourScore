import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const WEIGHTS_TABLE = [
  { dim: 'School Quality',  general: '20%', family: '35%', professional: '10%', retiree: '3%',  investor: '15%' },
  { dim: 'Air Quality',     general: '15%', family: '15%', professional: '15%', retiree: '15%', investor: '5%'  },
  { dim: 'Flood Risk',      general: '15%', family: '10%', professional: '3%',  retiree: '10%', investor: '3%'  },
  { dim: 'Healthcare',      general: '15%', family: '10%', professional: '15%', retiree: '30%', investor: '10%' },
  { dim: 'Crime Safety',    general: '15%', family: '20%', professional: '15%', retiree: '20%', investor: '10%' },
  { dim: 'Transport',       general: '10%', family: '5%',  professional: '25%', retiree: '5%',  investor: '20%' },
  { dim: 'Property Value',  general: '5%',  family: '2%',  professional: '15%', retiree: '2%',  investor: '35%' },
  { dim: 'Greenery',        general: '5%',  family: '3%',  professional: '2%',  retiree: '15%', investor: '2%'  },
];

const DATA_SOURCES = [
  {
    name: 'Air Quality',
    source: 'CPCB (Central Pollution Control Board)',
    url: 'https://data.gov.in',
    update: 'Hourly',
    raw: 'AQI (Air Quality Index) value from nearest monitoring station',
    scoring: 'AQI ≤50 → 100pts, AQI 51-100 → 80pts, AQI 101-200 → 50pts, AQI >200 → 20pts. Score adjusted linearly within bands.',
  },
  {
    name: 'School Quality',
    source: 'CBSE (Central Board of Secondary Education)',
    url: 'https://cbse.gov.in',
    update: 'Annual (2023 dataset)',
    raw: 'Count of CBSE-affiliated schools geocoded within 3km radius of the searched location',
    scoring: '≥5 schools → 100pts, 3-4 → 75pts, 1-2 → 50pts, 0 → 20pts. Mapped to 0-100.',
  },
  {
    name: 'Flood Risk',
    source: 'NDMA (National Disaster Management Authority)',
    url: 'https://ndma.gov.in',
    update: 'Static (updated post-flood events)',
    raw: 'Point-in-polygon test: is the searched lat/lng within a recorded NDMA flood hazard zone?',
    scoring: 'In flood zone → 20pts. Outside all flood zones → 85pts.',
  },
  {
    name: 'Healthcare',
    source: 'Google Maps Places API',
    url: 'https://developers.google.com/maps',
    update: 'Near real-time',
    raw: 'Count of hospitals, clinics, and medical centres within 3km radius from Google Places',
    scoring: '≥5 facilities → 100pts, 3-4 → 75pts, 1-2 → 50pts, 0 → 20pts.',
  },
  {
    name: 'Crime Safety',
    source: 'NCRB (National Crime Records Bureau)',
    url: 'https://ncrb.gov.in',
    update: 'Annual (Crime in India 2023 report)',
    raw: 'Total cognisable crimes per 100,000 population for the Pune district',
    scoring: 'Rate <150 → 90pts, 150-250 → 70pts, 250-400 → 50pts, >400 → 25pts.',
  },
  {
    name: 'Transport',
    source: 'Google Maps Places API (transit_station type)',
    url: 'https://developers.google.com/maps',
    update: 'Near real-time',
    raw: 'Count of bus stops and transit stations within 500m radius (PMPML network)',
    scoring: '≥5 stops → 100pts, 3-4 → 75pts, 1-2 → 50pts, 0 → 20pts.',
  },
  {
    name: 'Property Value',
    source: 'Gemini Search Grounding (live web data)',
    url: 'https://ai.google.dev',
    update: '~Monthly (grounded on current web)',
    raw: '₹/sqft price estimate and 12-month appreciation trend from curated real estate sources',
    scoring: 'Appreciation >8% → 100pts, 4-8% → 70pts, 1-4% → 50pts, <1% → 30pts. Price band also considered.',
  },
  {
    name: 'Greenery',
    source: 'Google Maps Places API (park type)',
    url: 'https://developers.google.com/maps',
    update: 'Near real-time',
    raw: 'Count of parks and green spaces within 1km radius',
    scoring: '≥4 parks → 100pts, 2-3 → 70pts, 1 → 45pts, 0 → 20pts.',
  },
];

const LIMITATIONS = [
  {
    title: 'Crime data is district-level only',
    body: 'NCRB publishes crime data at district granularity, not locality level. The crime score for Wakad uses the same Pune district crime rate as Koregaon Park. Actual safety varies significantly within a district — please verify with local sources.',
  },
  {
    title: 'AQI station proximity varies',
    body: 'CPCB monitoring stations can be 2–8km away from the searched locality. We use the nearest available station — if that station is monitoring a different microclimate (near a highway vs. inside a residential zone), the AQI may not reflect local conditions precisely.',
  },
  {
    title: 'Property data via AI search — verify independently',
    body: 'Property prices are estimated using Gemini Search Grounding on current web data. This is directionally accurate but should not be used for financial decisions without verification from a registered property consultant or direct market enquiry.',
  },
  {
    title: 'Schools: CBSE only, private/international excluded',
    body: 'Our school count includes only CBSE-affiliated schools from the official 2023 registry. ICSE, IB, Cambridge, and state board schools are not counted. Private international schools — which are prominent in areas like Koregaon Park and Kalyani Nagar — are excluded.',
  },
  {
    title: 'Pune only for now',
    body: 'NeighbourScore currently covers only localities within Pune\'s bounding box (lat 18.40–18.65, lng 73.70–74.00). Searches outside this area will not return reliable scores. Mumbai, Bangalore, and Hyderabad coverage is planned.',
  },
];

const SOURCES_LIST = [
  { name: 'CPCB', full: 'Central Pollution Control Board', url: 'https://data.gov.in', note: 'Hourly AQI data' },
  { name: 'CBSE', full: 'Central Board of Secondary Education', url: 'https://cbse.gov.in', note: 'School registry 2023' },
  { name: 'NDMA', full: 'National Disaster Management Authority', url: 'https://ndma.gov.in', note: 'Flood hazard zones' },
  { name: 'NCRB', full: 'National Crime Records Bureau', url: 'https://ncrb.gov.in', note: 'Crime in India 2023' },
  { name: 'Google Maps Places API', full: 'Google Maps Platform', url: 'https://developers.google.com/maps', note: 'Hospitals, transport, parks' },
  { name: 'GNews API', full: 'GNews', url: 'https://gnews.io', note: 'Recent locality news' },
];

const inView = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55 },
};

function Section({ title, label, children }) {
  return (
    <motion.section {...inView} style={{ marginBottom: 64 }}>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: '#6366F1',
          letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12
        }}>
          {label}
        </div>
      )}
      <h2 style={{
        fontFamily: 'var(--font-heading)', fontSize: 'clamp(24px, 3.5vw, 32px)',
        fontWeight: 700, color: '#1A1A2E', letterSpacing: '-0.025em',
        lineHeight: 1.2, marginBottom: 24
      }}>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function Card({ children }) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function MethodologyPage({ onGoHome }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}
    >
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          top: -150, left: -150, filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          bottom: -100, right: -100, filter: 'blur(40px)',
        }} />
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 24px 80px', position: 'relative', zIndex: 1 }}>
        {/* Back button */}
        <button
          onClick={onGoHome}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.9)',
            borderRadius: 12, padding: '8px 16px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: '#64748B',
            fontFamily: 'var(--font-body)', marginBottom: 48,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#6366F1'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* Page header */}
        <motion.div {...inView} style={{ marginBottom: 64 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#6366F1',
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 16
          }}>
            How It Works
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)', fontSize: 'clamp(34px, 5vw, 52px)',
            fontWeight: 700, color: '#1A1A2E', letterSpacing: '-0.03em',
            lineHeight: 1.1, marginBottom: 18
          }}>
            NeighbourScore Methodology
          </h1>
          <p style={{ fontSize: 17, color: '#94A3B8', lineHeight: 1.78, maxWidth: 620 }}>
            Every number in NeighbourScore traces back to a verifiable government or public
            data source. This page explains exactly how scores are calculated, what the data
            means, and where we fall short.
          </p>
        </motion.div>

        {/* SECTION 1 — Score calculation */}
        <Section label="Section 01" title="How scores are calculated">
          <Card>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.78, marginBottom: 0 }}>
              NeighbourScore is a <strong>weighted composite of 8 dimensions</strong>. Each dimension
              is scored 0–100 from verified government data. The composite score is the weighted
              average of all 8 dimensions. Weights vary based on the profile you select — a Family
              profile weighs School Quality heavily, while an Investor profile emphasises Property Value.
            </p>
          </Card>

          {/* Weights table */}
          <div style={{ overflowX: 'auto', marginTop: 20 }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontFamily: 'var(--font-body)', fontSize: 13,
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(99,102,241,0.15)' }}>
                  {['Dimension', 'Default', 'Family', 'Professional', 'Retiree', 'Investor'].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Dimension' ? 'left' : 'center',
                      padding: '10px 12px', color: '#6366F1',
                      fontWeight: 700, fontSize: 11, letterSpacing: '0.06em',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEIGHTS_TABLE.map((row, i) => (
                  <tr
                    key={row.dim}
                    style={{
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.5)' : 'transparent',
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                    }}
                  >
                    <td style={{ padding: '10px 12px', color: '#1A1A2E', fontWeight: 600 }}>{row.dim}</td>
                    {['general', 'family', 'professional', 'retiree', 'investor'].map(k => (
                      <td key={k} style={{ padding: '10px 12px', textAlign: 'center', color: '#64748B' }}>
                        {row[k]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* SECTION 2 — Data sources */}
        <Section label="Section 02" title="Data sources & scoring logic">
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.75, marginBottom: 24 }}>
            For each dimension, here's what data is fetched, how often it updates, and how it's
            converted to a 0–100 score.
          </p>
          {DATA_SOURCES.map(ds => (
            <Card key={ds.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', marginBottom: 2 }}>{ds.name}</div>
                  <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 500 }}>{ds.source}</div>
                </div>
                <span style={{
                  background: 'rgba(99,102,241,0.08)', color: '#6366F1',
                  fontSize: 11, fontWeight: 600, padding: '3px 10px',
                  borderRadius: 6, border: '1px solid rgba(99,102,241,0.15)',
                  whiteSpace: 'nowrap',
                }}>
                  Updates: {ds.update}
                </span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Raw data: </span>
                <span style={{ fontSize: 13, color: '#64748B' }}>{ds.raw}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Score formula: </span>
                <span style={{ fontSize: 13, color: '#64748B' }}>{ds.scoring}</span>
              </div>
            </Card>
          ))}
        </Section>

        {/* SECTION 3 — Known limitations */}
        <Section label="Section 03" title="Known limitations">
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.75, marginBottom: 24 }}>
            We believe in radical transparency. Here are the known gaps in our current data
            that you should factor into your decisions.
          </p>
          {LIMITATIONS.map(lim => (
            <Card key={lim.title}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#E6A817',
                  flexShrink: 0, marginTop: 7,
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', marginBottom: 6 }}>
                    {lim.title}
                  </div>
                  <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7, margin: 0 }}>
                    {lim.body}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </Section>

        {/* SECTION 4 — Data transparency */}
        <Section label="Section 04" title="Data transparency">
          <Card>
            <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.78, marginBottom: 0 }}>
              Every score in NeighbourScore comes from a government or verified public source.
              We use <strong>no user reviews</strong>, <strong>no paid placements</strong>, and{' '}
              <strong>no broker data</strong>. If a data source is unavailable for a locality,
              we show a fallback estimate and clearly label it as such.
            </p>
          </Card>
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SOURCES_LIST.map(src => (
              <div
                key={src.name}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.9)',
                  borderRadius: 12, padding: '14px 18px', flexWrap: 'wrap', gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E' }}>{src.name}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8' }}>{src.full} · {src.note}</div>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: '#6366F1', fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Visit <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 32, textAlign: 'center'
        }}>
          <p style={{ fontSize: 12, color: '#94A3B8' }}>
            NeighbourScore · Google Solution Challenge 2026 ·{' '}
            <button
              onClick={onGoHome}
              style={{
                color: '#6366F1', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-body)',
              }}
            >
              Back to search →
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default MethodologyPage;
