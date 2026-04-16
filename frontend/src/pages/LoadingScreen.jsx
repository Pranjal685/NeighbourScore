import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cleanLocalityName } from '../utils/localityUtils';

const ROWS = [
  { emoji: '🌬️', source: 'CPCB Air Quality API',      fetching: 'Querying monitoring stations...', result: 'AQI 87 · Moderate' },
  { emoji: '🏫', source: 'CBSE School Database',       fetching: 'Scanning 3km radius...',          result: '7 schools found' },
  { emoji: '🌊', source: 'NDMA Flood Zone Check',      fetching: 'Checking hazard atlas...',        result: 'Not in flood zone' },
  { emoji: '🏥', source: 'Google Maps · Hospitals',    fetching: 'Searching nearby...',             result: '5 hospitals nearby' },
  { emoji: '🛡️', source: 'NCRB Crime Data 2023',       fetching: 'Loading district data...',        result: 'District data loaded' },
  { emoji: '🚌', source: 'PMPML Transport Data',       fetching: 'Counting bus stops...',           result: '3 stops within 500m' },
  { emoji: '📈', source: 'Property Trend Data',        fetching: 'Fetching market data...',         result: '₹8,200/sqft · +7%' },
  { emoji: '🌳', source: 'OpenStreetMap Parks',        fetching: 'Finding green spaces...',         result: '3 parks found' },
];

// Each row "completes" at a staggered time
const ROW_DELAYS = [400, 650, 900, 1100, 1350, 1550, 1750, 1950];

function LoadingScreen({ localityName }) {
  const [completedRows, setCompletedRows] = useState(new Set());
  const [showFinal, setShowFinal] = useState(false);

  useEffect(() => {
    const timers = ROW_DELAYS.map((delay, i) =>
      setTimeout(() => setCompletedRows(prev => new Set([...prev, i])), delay)
    );
    const finalTimer = setTimeout(() => setShowFinal(true), 2200);
    return () => { timers.forEach(clearTimeout); clearTimeout(finalTimer); };
  }, []);

  const shortName = cleanLocalityName(localityName) || 'Your locality';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="grid-bg"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative'
      }}
    >
      {/* Logo */}
      <div style={{
        position: 'absolute',
        top: 22,
        left: 32,
        fontFamily: 'var(--font-heading)',
        fontSize: 18,
        fontWeight: 700,
        color: '#1A1A2E'
      }}>
        <span style={{ color: 'var(--accent)' }}>N</span>eighbourScore
      </div>

      <div style={{ maxWidth: 480, width: '100%' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 32 }}
        >
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22,
            fontWeight: 600,
            color: '#1A1A2E',
            letterSpacing: '-0.02em',
            marginBottom: 6
          }}>
            Analyzing {shortName}
          </h2>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Fetching data from 8 government sources...
          </p>
        </motion.div>

        {/* Rows panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="glass-card"
          style={{
            overflow: 'hidden',
            marginBottom: 20
          }}
        >
          {ROWS.map((row, i) => {
            const done = completedRows.has(i);
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.22 + i * 0.05, duration: 0.3 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 16px',
                  borderBottom: i < ROWS.length - 1 ? '1px solid var(--border)' : 'none',
                  background: done ? 'rgba(63,185,80,0.05)' : 'transparent',
                  transition: 'background 0.4s'
                }}
              >
                {/* Spinner / check */}
                <div style={{ width: 18, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {done ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -80 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 340, damping: 18 }}
                    >
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="7.5" cy="7.5" r="7" fill="rgba(63,185,80,0.15)" stroke="#3FB950" strokeWidth="1" />
                        <path d="M4.5 7.5l2 2 4-4" stroke="#3FB950" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </motion.div>
                  ) : (
                    <div style={{
                      width: 13,
                      height: 13,
                      border: '2px solid rgba(0,0,0,0.08)',
                      borderTopColor: '#E6A817',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite'
                    }} />
                  )}
                </div>

                {/* Emoji */}
                <span style={{ fontSize: 16, flexShrink: 0 }}>{row.emoji}</span>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: done ? 'var(--text-primary)' : 'var(--text-secondary)',
                    transition: 'color 0.3s',
                    marginBottom: 1
                  }}>
                    {row.source}
                  </div>
                </div>

                {/* Status */}
                <AnimatePresence mode="wait">
                  {done ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="loading-row-status"
                    >
                      {row.result}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="fetching"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="loading-row-fetching"
                    >
                      {row.fetching}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Final status */}
        <AnimatePresence>
          {showFinal && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
                borderRadius: 100,
                padding: '8px 20px',
                fontSize: 13,
                color: 'var(--accent)',
                fontWeight: 500
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  border: '2px solid rgba(230,168,23,0.3)',
                  borderTopColor: '#E6A817',
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite'
                }} />
                Generating NeighbourScore...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p style={{
          fontSize: 11,
          color: '#64748B',
          textAlign: 'center',
          marginTop: 20,
          lineHeight: 1.5
        }}>
          Powered by CPCB · CBSE · NDMA · NCRB 2023 · Google Maps
        </p>
      </div>
    </motion.div>
  );
}

export default LoadingScreen;
