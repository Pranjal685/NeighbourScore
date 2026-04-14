import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Wind, GraduationCap, Waves, HeartPulse, Shield, Bus, TrendingUp, Trees, ChevronDown, X } from 'lucide-react';
import EvidenceDrawer from './EvidenceDrawer';

export function getScoreColor(score) {
  if (score === null || score === undefined) return '#64748B';
  if (score >= 80) return '#3FB950';
  if (score >= 60) return '#E6A817';
  return '#F85149';
}

const ICON_MAP = {
  air_quality: Wind,
  school_quality: GraduationCap,
  flood_risk: Waves,
  healthcare: HeartPulse,
  crime_safety: Shield,
  transport: Bus,
  property_value: TrendingUp,
  greenery: Trees,
};

const RAW_STAT = {
  air_quality: d => {
    if (!d?.aqi || d.aqi === 0 || d.fallback) return d?.station_name ? `${d.station_name} · Locality estimate` : 'Locality estimate';
    return `AQI ${d.aqi} · ${d.station_name || 'Nearest station'}`;
  },
  school_quality: d => d?.count != null ? `${d.count} CBSE schools · 3km radius` : null,
  flood_risk: d => d?.in_flood_zone != null ? (d.in_flood_zone ? 'Located in flood zone' : 'Outside flood zone') : null,
  healthcare: d => d?.count != null ? `${d.count} hospitals · 3km radius` : null,
  crime_safety: d => d?.district ? `${d.district} district · Rate ${Math.round(d.crime_rate || 0)}/100k` : null,
  transport: d => d?.count != null ? `${d.count} bus stops · 500m radius` : null,
  property_value: d => d?.price_per_sqft ? `₹${d.price_per_sqft.toLocaleString('en-IN')}/sqft · ${d.trend_12m_pct > 0 ? '+' : ''}${d.trend_12m_pct}% trend` : null,
  greenery: d => d?.count != null ? `${d.count} parks · 1km radius` : null,
};

function ProgressBar({ score, color, delay = 0 }) {
  return (
    <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${score || 0}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay, ease: 'easeOut' }}
        style={{ height: '100%', background: color, borderRadius: 3 }}
      />
    </div>
  );
}

// ─── Animated Chevron ─────────────────────────────────────────────────────────
function ExpandChevron({ isExpanded, color }) {
  return (
    <motion.div
      animate={{ rotate: isExpanded ? 180 : 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
    >
      <ChevronDown size={14} color={color} style={{ opacity: 0.6 }} />
    </motion.div>
  );
}

// ─── Shared Modal Wrapper ────────────────────────────────────────────────────────
function EvidenceModal({ isExpanded, setIsExpanded, dimensionKey, name, color, raw, displayScore }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(240,244,255,0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'auto'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 500,
              maxHeight: '85vh',
              overflowY: 'auto',
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.95)',
              borderTop: `4px solid ${color}`,
              padding: '24px',
              cursor: 'default',
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E' }}>{name} Data</div>
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                style={{
                  background: 'rgba(0,0,0,0.05)', border: 'none',
                  borderRadius: '50%', width: 32, height: 32,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <EvidenceDrawer dimensionKey={dimensionKey} raw={raw} score={displayScore} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// TIER 1 — large card (School, Air, Flood) — full Gemini narrative + big score
export function Tier1Card({ dimensionKey, name, score, weight, narrative, raw, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayScore = (score === null || score === undefined) ? 20 : Math.max(score, 20);
  const color = getScoreColor(displayScore);
  const Icon = ICON_MAP[dimensionKey] || Wind;
  const stat = RAW_STAT[dimensionKey]?.(raw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="glass-card"
      style={{
        borderTop: `3px solid ${color}`,
        borderRadius: 16,
        padding: '22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}1a`, border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={18} color={color} strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', letterSpacing: '-0.01em' }}>{name}</div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>Weight: {weight}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            fontSize: 36,
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color,
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            {displayScore}
          </div>
          <ExpandChevron isExpanded={isExpanded} color={color} />
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar score={displayScore} color={color} delay={0.1 + index * 0.06} />

      {/* Raw stat */}
      {stat && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: `${color}0d`,
          border: `1px solid ${color}20`,
          borderRadius: 8,
          padding: '5px 10px',
          fontSize: 11,
          color,
          fontWeight: 500
        }}>
          {stat}
        </div>
      )}

      {/* Narrative */}
      <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.7, margin: 0 }}>
        {narrative || 'AI analysis unavailable for this dimension.'}
      </p>

      {/* Evidence Modal */}
      <EvidenceModal
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        dimensionKey={dimensionKey}
        name={name}
        color={color}
        raw={raw}
        displayScore={displayScore}
      />
    </motion.div>
  );
}

// TIER 2 — medium card (Healthcare, Crime, Transport)
export function Tier2Card({ dimensionKey, name, score, weight, narrative, raw, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayScore = (score === null || score === undefined) ? 20 : Math.max(score, 20);
  const color = getScoreColor(displayScore);
  const Icon = ICON_MAP[dimensionKey] || Wind;
  const stat = RAW_STAT[dimensionKey]?.(raw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="glass-card"
      style={{
        borderLeft: `3px solid ${color}`,
        borderRadius: 14,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}1a`, border: `1px solid ${color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={18} color={color} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 28,
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color,
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            {displayScore}
          </span>
          <ExpandChevron isExpanded={isExpanded} color={color} />
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar score={displayScore} color={color} delay={0.1 + index * 0.06} />

      {/* Stat */}
      {stat && (
        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{stat}</div>
      )}

      {/* Narrative */}
      <p style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.65, margin: 0 }}>
        {narrative || 'Analysis data unavailable.'}
      </p>

      <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>Weight: {weight}</div>

      {/* Evidence Modal */}
      <EvidenceModal
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        dimensionKey={dimensionKey}
        name={name}
        color={color}
        raw={raw}
        displayScore={displayScore}
      />
    </motion.div>
  );
}

// TIER 3 — compact card (Property, Greenery)
export function Tier3Card({ dimensionKey, name, score, weight, narrative, raw, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayScore = (score === null || score === undefined) ? 20 : Math.max(score, 20);
  const color = getScoreColor(displayScore);
  const Icon = ICON_MAP[dimensionKey] || Wind;
  const stat = RAW_STAT[dimensionKey]?.(raw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
      onClick={() => setIsExpanded(!isExpanded)}
      className="glass-card"
      style={{
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${color}1a`, border: `1px solid ${color}1e`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={18} color={color} strokeWidth={1.5} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 24,
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color,
            lineHeight: 1,
            letterSpacing: '-0.03em'
          }}>
            {displayScore}
          </span>
          <ExpandChevron isExpanded={isExpanded} color={color} />
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar score={displayScore} color={color} delay={0.1 + index * 0.06} />

      {stat && <div style={{ fontSize: 11, color: '#64748B' }}>{stat}</div>}

      <p style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.6, margin: 0 }}>
        {narrative || 'Analysis data unavailable.'}
      </p>

      <div style={{ fontSize: 10, color: 'rgba(26,26,46,0.3)', textAlign: 'right' }}>Weight: {weight}</div>

      {/* Evidence Modal */}
      <EvidenceModal
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        dimensionKey={dimensionKey}
        name={name}
        color={color}
        raw={raw}
        displayScore={displayScore}
      />
    </motion.div>
  );
}

// Default export for backward compat (used in CompareMode)
function DimensionCard({ dimensionKey, name, score, weight, narrative, index = 0 }) {
  return <Tier2Card dimensionKey={dimensionKey} name={name} score={score} weight={weight} narrative={narrative} index={index} />;
}

export default DimensionCard;
