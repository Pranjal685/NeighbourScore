import React from 'react';
import { motion } from 'framer-motion';
import { getScoreColor } from './DimensionCard';
import { Navigation, ArrowUpRight } from 'lucide-react';

function NearbyAlternatives({ alternatives, onSearch }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div 
      className="glass-card"
      style={{
      borderRadius: 16,
      padding: 24,
      marginTop: 32,
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Navigation size={18} color="#6366F1" strokeWidth={1.5} /> Better Alternatives Nearby
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
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
              whileHover={{ y: -2, borderColor: 'rgba(0,0,0,0.1)' }}
              onClick={() => onSearch && onSearch(alt.name + ', Pune')}
              className="glass-card"
              style={{
                borderRadius: 12,
                padding: '16px 20px',
                flex: '1 1 160px',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                minWidth: 150,
              }}
            >
              {/* Area name */}
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>
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
                <span style={{ fontSize: 13, color: '#64748B' }}>/ 100</span>
              </div>

              {/* Distance */}
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>
                ~{alt.distance_km} km away
              </div>

              {/* Improvement pill & Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(63,185,80,0.1)',
                  color: '#3FB950',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 100,
                }}>
                  +{alt.improvement} vs current area
                </div>
                <ArrowUpRight size={14} color="#64748B" strokeWidth={1.5} />
              </div>

              {/* CTA */}
              <div style={{ fontSize: 11, color: '#64748B' }}>
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
