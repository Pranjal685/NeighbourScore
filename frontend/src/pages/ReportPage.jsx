import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Info, Cpu } from 'lucide-react';
import Navbar from '../components/Navbar';
import ScoreGauge, { getScoreColor, getScoreLabel } from '../components/ScoreGauge';
import DimensionGrid from '../components/DimensionGrid';
import NeighbourRadarChart from '../components/RadarChart';
import MapView from '../components/MapView';
import CompareMode from '../components/CompareMode';

const inView = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--accent)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      marginBottom: 18
    }}>
      {children}
    </div>
  );
}

const PROFILE_META = {
  family:       { label: 'Family', icon: '👨‍👩‍👧' },
  professional: { label: 'Professional', icon: '💼' },
  retiree:      { label: 'Retiree', icon: '🧓' },
  investor:     { label: 'Investor', icon: '🏠' },
};

function ReportPage({ result, lat, lng, onNewSearch, profile }) {
  const [showCompare, setShowCompare] = useState(false);
  const activeProfile = result.profile || profile || 'general';
  const profileMeta = PROFILE_META[activeProfile] || null;
  const composite = Math.max(result.composite || 0, 20);
  const scoreColor = getScoreColor(composite);
  const scoreLabel = getScoreLabel(composite);
  const localityShort = (result.locality || '').split(',')[0].trim();
  const timestamp = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ minHeight: '100vh', background: 'var(--bg-base)' }}
    >
      <Navbar onNewSearch={onNewSearch} locality={result.locality} />

      <div className="report-inner">

        {/* ── PART 1: Score Hero ── */}
        <motion.div {...inView} style={{ padding: '56px 0 48px' }}>
          {/* Two-column hero layout */}
          <div
            className="hero-score-grid"
            style={{ marginBottom: 40 }}
          >
            {/* Left: big score display */}
            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                marginBottom: 6,
                lineHeight: 1.15
              }}>
                {result.locality}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: profileMeta ? 12 : 32 }}>
                Pune District, Maharashtra &nbsp;·&nbsp; analyzed with verified government data
              </p>

              {profileMeta && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    background: 'rgba(230,168,23,0.08)',
                    border: '1px solid rgba(230,168,23,0.2)',
                    borderRadius: 100,
                    padding: '4px 14px',
                    fontSize: 12,
                    color: '#E6A817',
                    fontWeight: 600,
                    marginBottom: 24,
                  }}
                >
                  <span>{profileMeta.icon}</span>
                  <span>Personalized for: {profileMeta.label}</span>
                </motion.div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <ScoreGauge score={composite} />
                <div>
                  <div style={{
                    fontSize: 80,
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    color: scoreColor,
                    lineHeight: 1,
                    letterSpacing: '-0.05em'
                  }}>
                    {composite}
                  </div>
                  <div style={{ fontSize: 18, color: 'var(--text-muted)', marginTop: 4 }}>/ 100</div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: 'spring', stiffness: 260 }}
                    style={{ marginTop: 12 }}
                  >
                    <span style={{
                      background: `${scoreColor}14`,
                      color: scoreColor,
                      border: `1px solid ${scoreColor}28`,
                      padding: '5px 18px',
                      borderRadius: 100,
                      fontSize: 13,
                      fontWeight: 600
                    }}>
                      {scoreLabel} Neighborhood
                    </span>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right: radar chart */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '20px 16px 8px'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 8 }}>
                8-Dimension Profile
              </div>
              <NeighbourRadarChart dimensions={result.dimensions} name={result.locality} />
            </div>
          </div>

          {/* AI Narrative */}
          {result.overall_narrative && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-border)',
              borderRadius: 14,
              padding: '20px 24px',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1
              }}>
                <Cpu size={15} color="#E6A817" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  AI Analysis · Powered by Gemini
                </div>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
                  {result.overall_narrative}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── PART 2: Dimension Breakdown ── */}
        <motion.div {...inView} style={{ marginBottom: 48 }}>
          <SectionLabel>Dimension Breakdown</SectionLabel>
          <DimensionGrid dimensions={result.dimensions} />
        </motion.div>

        {/* ── PART 3: Map ── */}
        {lat && lng && (
          <motion.div {...inView} style={{ marginBottom: 48 }}>
            <SectionLabel>Location Map</SectionLabel>
            <div className="map-bleed" style={{ position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', height: 320 }}>
              <MapView lat={lat} lng={lng} />
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: 'rgba(13,17,23,0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid var(--border-mid)',
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                📍 {localityShort}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── PART 4: Compare ── */}
        {!showCompare ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 48 }}
          >
            <button
              onClick={() => setShowCompare(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
                color: 'var(--accent)',
                fontSize: 14,
                fontWeight: 600,
                padding: '12px 28px',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(230,168,23,0.16)';
                e.currentTarget.style.borderColor = 'rgba(230,168,23,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent-soft)';
                e.currentTarget.style.borderColor = 'var(--accent-border)';
              }}
            >
              <GitCompare size={15} />
              + Compare with another locality
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 48 }}
          >
            <CompareMode firstResult={result} profile={activeProfile} />
          </motion.div>
        )}

        {/* ── PART 5: Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}
        >
          {/* Disclaimer */}
          <div style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 12
          }}>
            <Info size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: 'var(--text-secondary)' }}>Data disclaimer:</strong>{' '}
              Crime data is district-level (NCRB 2023) — all Pune localities share the same district score.
              Property trends are from aggregated 2024 market data, updated periodically.
              AQI reflects the nearest CPCB monitoring station, not hyperlocal air quality.
              Coverage: Pune Metropolitan Area only.
            </p>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Data sourced from CPCB · CBSE · NDMA · NCRB · Google Maps
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-hint)', textAlign: 'center' }}>
            Last updated: {timestamp} &nbsp;·&nbsp; NeighbourScore · Google Solution Challenge 2026
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ReportPage;
