import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, GraduationCap, Waves, HeartPulse, Shield, Bus, TrendingUp, Leaf, ChevronDown } from 'lucide-react';
import EvidenceDrawer from './EvidenceDrawer';

export function getScoreColor(score) {
  if (score === null || score === undefined) return '#484F58';
  if (score >= 80) return '#3FB950';
  if (score >= 60) return '#E6A817';
  return '#F85149';
}

const ICON_MAP = {
  air_quality:    Wind,
  school_quality: GraduationCap,
  flood_risk:     Waves,
  healthcare:     HeartPulse,
  crime_safety:   Shield,
  transport:      Bus,
  property_value: TrendingUp,
  greenery:       Leaf,
};

const RAW_STAT = {
  air_quality:    d => d?.aqi        ? `AQI ${d.aqi} · ${d.station_name || 'Nearest station'}` : null,
  school_quality: d => d?.count != null ? `${d.count} CBSE schools · 3km radius` : null,
  flood_risk:     d => d?.in_flood_zone != null ? (d.in_flood_zone ? 'Located in flood zone' : 'Outside flood zone') : null,
  healthcare:     d => d?.count != null ? `${d.count} hospitals · 3km radius` : null,
  crime_safety:   d => d?.district   ? `${d.district} district · Rate ${Math.round(d.crime_rate || 0)}/100k` : null,
  transport:      d => d?.count != null ? `${d.count} bus stops · 500m radius` : null,
  property_value: d => d?.price_per_sqft ? `₹${d.price_per_sqft.toLocaleString('en-IN')}/sqft · ${d.trend_12m_pct > 0 ? '+' : ''}${d.trend_12m_pct}% trend` : null,
  greenery:       d => d?.count != null ? `${d.count} parks · 1km radius` : null,
};

function ProgressBar({ score, color, delay = 0 }) {
  return (
    <div style={{ height: 5, background: 'rgba(240,246,252,0.05)', borderRadius: 3, overflow: 'hidden' }}>
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

// TIER 1 — large card (School, Air, Flood) — full Gemini narrative + big score
export function Tier1Card({ dimensionKey, name, score, weight, narrative, raw, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayScore = (score === null || score === undefined) ? 20 : Math.max(score, 20);
  const color = getScoreColor(displayScore);
  const Icon = ICON_MAP[dimensionKey] || Wind;
  const stat = RAW_STAT[dimensionKey]?.(raw);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
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
            width: 36, height: 36, borderRadius: 10,
            background: `${color}18`, border: `1px solid ${color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={16} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>{name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Weight: {weight}</div>
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
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
        {narrative || 'AI analysis unavailable for this dimension.'}
      </p>

      {/* Evidence Drawer */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <EvidenceDrawer dimensionKey={dimensionKey} raw={raw} score={displayScore} />
          </motion.div>
        )}
      </AnimatePresence>
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
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
            width: 30, height: 30, borderRadius: 8,
            background: `${color}14`, border: `1px solid ${color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={13} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{name}</span>
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
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{stat}</div>
      )}

      {/* Narrative */}
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
        {narrative || 'Analysis data unavailable.'}
      </p>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Weight: {weight}</div>

      {/* Evidence Drawer */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <EvidenceDrawer dimensionKey={dimensionKey} raw={raw} score={displayScore} />
          </motion.div>
        )}
      </AnimatePresence>
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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
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
            width: 26, height: 26, borderRadius: 7,
            background: `${color}12`, border: `1px solid ${color}1e`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={11} color={color} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{name}</span>
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

      {stat && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat}</div>}

      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
        {narrative || 'Analysis data unavailable.'}
      </p>

      <div style={{ fontSize: 10, color: 'var(--text-hint)', textAlign: 'right' }}>Weight: {weight}</div>

      {/* Evidence Drawer */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <EvidenceDrawer dimensionKey={dimensionKey} raw={raw} score={displayScore} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Default export for backward compat (used in CompareMode)
function DimensionCard({ dimensionKey, name, score, weight, narrative, index = 0 }) {
  return <Tier2Card dimensionKey={dimensionKey} name={name} score={score} weight={weight} narrative={narrative} index={index} />;
}

export default DimensionCard;
