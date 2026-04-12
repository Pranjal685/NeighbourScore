import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from './DimensionCard';

function NearbyAlternatives({ alternatives, onSearch }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div style={{
      background: 'var(--bg-card, #161B22)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: 24,
      marginTop: 32,
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
          📍 Better Alternatives Nearby
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Areas within reach with higher NeighbourScores
        </div>
      </div>

      {/* Cards row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 20,
        flexWrap: 'wrap',
      }}>
        {alternatives.map((alt, i) => {
          const scoreColor = getScoreColor(alt.score);
          return (
            <motion.div
              key={alt.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.1 }}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.18)' }}
              onClick={() => onSearch && onSearch(alt.name + ', Pune')}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '16px 20px',
                flex: '1 1 160px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                minWidth: 150,
              }}
            >
              {/* Area name */}
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                {alt.name}
              </div>

              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: scoreColor,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  {alt.score}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 100</span>
              </div>

              {/* Distance */}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                ~{alt.distance_km} km away
              </div>

              {/* Improvement pill */}
              <div style={{
                display: 'inline-block',
                background: 'rgba(63,185,80,0.1)',
                color: '#3FB950',
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 100,
                marginBottom: 10,
              }}>
                +{alt.improvement} vs current area
              </div>

              {/* CTA */}
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Click to analyze →
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default NearbyAlternatives;
