import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { GitCompare, Info, Cpu, MapPin, LayoutGrid, Map } from 'lucide-react';
import Navbar from '../components/Navbar';
import ScoreGauge, { getScoreColor, getScoreLabel } from '../components/ScoreGauge';
import { cleanLocalityName } from '../utils/localityUtils';
import DimensionGrid from '../components/DimensionGrid';
import NeighbourRadarChart from '../components/RadarChart';
import MapView from '../components/MapView';
import CompareMode from '../components/CompareMode';
import RedFlagAlert from '../components/RedFlagAlert';
import NearbyAlternatives from '../components/NearbyAlternatives';
import ShareModal from '../components/ShareModal';

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
  family: { label: 'Family', icon: '👨‍👩‍👧' },
  professional: { label: 'Professional', icon: '💼' },
  retiree: { label: 'Retiree', icon: '🧓' },
  investor: { label: 'Investor', icon: '🏠' },
};

function ReportPage({ result, lat, lng, onNewSearch, profile, onSearch, onGoMethodology, onGoLeaderboard }) {
  const [showCompare, setShowCompare] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const activeProfile = result.profile || profile || 'general';
  const profileMeta = PROFILE_META[activeProfile] || null;
  const composite = Math.max(result.composite || 0, 20);
  const scoreColor = getScoreColor(composite);
  const scoreLabel = getScoreLabel(composite);
  const localityShort = (result.locality || '').split(',')[0].trim();
  const cleanLocality = cleanLocalityName(result.locality);
  const timestamp = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Geocode a locality name and trigger a new search
  const handleAlternativeSearch = async (localityName) => {
    if (!onSearch) return;
    try {
      const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(localityName + ', Pune, India')}&key=${apiKey}`;
      const res = await fetch(url);
      const geoData = await res.json();
      if (geoData.results && geoData.results[0]) {
        const { lat: gLat, lng: gLng } = geoData.results[0].geometry.location;
        onSearch(gLat, gLng, localityName, activeProfile);
      }
    } catch (err) {
      console.error('Geocoding failed for alternative search:', err);
    }
  };

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ minHeight: '100vh', background: 'transparent' }}
    >
      {/* Scroll Progress Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #E6A817)',
          transformOrigin: '0%',
          scaleX,
          zIndex: 100,
        }}
      />

      {/* Background Blobs (smaller for Report context) */}
      <div className="blob-container" style={{ 
        position: 'fixed', 
        inset: 0, 
        overflow: 'hidden', 
        pointerEvents: 'none',
        zIndex: 0 
      }}>
        {/* Blob 1 */}
        <motion.div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            top: '-100px',
            left: '-100px',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, 20, -10, 5, 0],
            y: [0, -10, 20, -5, 0],
            scale: [1, 1.05, 0.97, 1.03, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Blob 2 */}
        <motion.div
          style={{
            position: 'absolute',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(230,168,23,0.1) 0%, transparent 70%)',
            top: '-50px',
            right: '-100px',
            filter: 'blur(40px)',
          }}
          animate={{
            x: [0, -15, 10, -5, 0],
            y: [0, 15, -20, 10, 0],
            scale: [1, 0.97, 1.05, 0.98, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Navbar onNewSearch={onNewSearch} locality={result.locality} onShare={() => setIsShareModalOpen(true)} onGoLeaderboard={onGoLeaderboard} />

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
                color: '#1A1A2E',
                letterSpacing: '-0.03em',
                marginBottom: 6,
                lineHeight: 1.15,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                <MapPin size={28} color="#6366F1" strokeWidth={1.5} />
                {cleanLocality}
              </h1>
              <p style={{ fontSize: 14, color: '#64748B', marginBottom: profileMeta ? 12 : 32 }}>
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

              <div className="score-display-row">
                <ScoreGauge score={composite} />
                <div>
                  <div className="score-number-display" style={{
                    color: scoreColor,
                  }}>
                    {composite}
                  </div>
                  <div style={{ fontSize: 18, color: '#64748B', marginTop: 4 }}>/ 100</div>
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
                    {onGoMethodology && (
                      <button
                        onClick={onGoMethodology}
                        style={{
                          display: 'block', marginTop: 10,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#94A3B8', fontSize: 11, fontFamily: 'var(--font-body)',
                          padding: 0, textDecoration: 'underline',
                        }}
                      >
                        How scores are calculated →
                      </button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Right: radar chart — hidden below 640px via CSS .radar-chart-panel */}
            <div
              className="glass-card radar-chart-panel"
              style={{ padding: '20px 16px 8px', borderRadius: 20 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, paddingLeft: 8 }}>
                8-Dimension Profile
              </div>
              <NeighbourRadarChart dimensions={result.dimensions} name={result.locality} />
            </div>
          </div>

          {/* AI Narrative */}
          {result.overall_narrative && (
            <div
              className="glass-card ai-narrative-box"
              style={{
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
                <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Cpu size={14} color="var(--accent)" strokeWidth={1.5} />
                  AI Analysis · Powered by Gemini
                </div>
                <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.75, margin: 0 }}>
                  {result.overall_narrative}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── PART 2: Dimension Breakdown ── */}
        <motion.div {...inView} style={{ marginBottom: 48 }}>
          <SectionLabel>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><LayoutGrid size={14} color="#94A3B8" strokeWidth={1.5} /> Dimension Breakdown</span>
          </SectionLabel>

          {/* Red Flag Alerts — above the grid */}
          <RedFlagAlert dimensions={result.dimensions} />

          <DimensionGrid dimensions={result.dimensions} />

          {/* Nearby Alternatives — below the grid */}
          <NearbyAlternatives
            alternatives={result.nearby_alternatives}
            onSearch={handleAlternativeSearch}
          />
        </motion.div>

        {/* ── PART 3: Map ── */}
        {lat && lng && (
          <motion.div {...inView} style={{ marginBottom: 48 }}>
            <SectionLabel>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Map size={14} color="#94A3B8" strokeWidth={1.5} /> Location Map</span>
            </SectionLabel>
            <div className="map-bleed map-container">
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
                color: '#1A1A2E',
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
              className="compare-trigger-btn"
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(230,168,23,0.16)';
                e.currentTarget.style.borderColor = 'rgba(230,168,23,0.4)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--accent-soft)';
                e.currentTarget.style.borderColor = 'var(--accent-border)';
              }}
            >
              <GitCompare size={15} strokeWidth={1.5} />
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
          <div
            className="glass-card"
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 12
            }}>
            <Info size={13} color="var(--text-muted)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.75, margin: 0 }}>
              <strong style={{ color: '#94A3B8' }}>Data disclaimer:</strong>{' '}
              Crime data is district-level (NCRB 2023) — all Pune localities share the same district score.
              Property trends are from aggregated 2024 market data, updated periodically.
              AQI reflects the nearest CPCB monitoring station, not hyperlocal air quality.
              Coverage: Pune Metropolitan Area only.
            </p>
          </div>

          <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
            Data sourced from CPCB · CBSE · NDMA · NCRB · Google Maps
          </p>
          <p style={{ fontSize: 11, color: 'rgba(26,26,46,0.3)', textAlign: 'center' }}>
            Last updated: {timestamp} &nbsp;·&nbsp; NeighbourScore · Google Solution Challenge 2026
          </p>
        </motion.div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        data={result} 
        />
      </div>
    </motion.div>
  );
}

export default ReportPage;
