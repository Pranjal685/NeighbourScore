import React from 'react';
import ScoreGauge, { getScoreColor, getScoreLabel } from './ScoreGauge';
import DimensionCard from './DimensionCard';

const DIMENSION_ICONS = {
  air_quality: '🌬️',
  school_quality: '🏫',
  flood_risk: '🌊',
  healthcare: '🏥',
  crime_safety: '🛡️',
  transport: '🚌',
  property_value: '📈',
  greenery: '🌳'
};

const DIMENSION_NAMES = {
  air_quality: 'Air quality',
  school_quality: 'School quality',
  flood_risk: 'Flood risk',
  healthcare: 'Healthcare',
  crime_safety: 'Crime safety',
  transport: 'Transport',
  property_value: 'Property value',
  greenery: 'Greenery'
};

const DIMENSION_ORDER = [
  'air_quality', 'school_quality', 'flood_risk', 'healthcare',
  'crime_safety', 'transport', 'property_value', 'greenery'
];

function ReportCard({ data, onCompare }) {
  const composite = data.composite || 0;
  const color = getScoreColor(composite);
  const label = getScoreLabel(composite);

  // Build summary narrative from the first available dimension narrative
  const summaryNarrative = data.dimensions?.air_quality?.narrative
    ? `${data.locality} scores ${composite} overall. ${
        Object.values(data.dimensions)
          .filter(d => d.narrative)
          .map(d => d.narrative)
          .slice(0, 2)
          .join(' ')
      }`
    : `${data.locality} has an overall NeighbourScore of ${composite} out of 100. Click on individual dimensions for detailed analysis.`;

  return (
    <div>
      {/* Locality header row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: '#1A1A2E',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            {data.locality}
          </h1>
          <p style={{
            fontSize: '13px',
            color: '#94A3B8',
            marginTop: '4px',
            margin: '4px 0 0 0'
          }}>
            Pune District, Maharashtra · analyzed just now
          </p>
        </div>
        <button
          onClick={onCompare}
          style={{
            background: 'transparent',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#818CF8',
            fontSize: '12px',
            fontWeight: 500,
            padding: '7px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
          }}
        >
          + Compare locality
        </button>
      </div>

      {/* Overall score card */}
      <div
        className="animate-fade-in glass-card"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '28px',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}
      >
        {/* Gauge */}
        <ScoreGauge score={composite} />

        {/* Right side info */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          {/* Badge */}
          <span style={{
            background: `${color}1F`,
            color: color,
            fontSize: '11px',
            fontWeight: 600,
            padding: '3px 12px',
            borderRadius: '100px',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            {label}
          </span>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#1A1A2E',
            margin: '0 0 8px 0'
          }}>
            NeighbourScore
          </h2>
          <p style={{
            fontSize: '13px',
            color: '#94A3B8',
            lineHeight: 1.7,
            margin: 0
          }}>
            {summaryNarrative}
          </p>
        </div>
      </div>

      {/* 8 Dimension cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}
        className="dimension-grid"
      >
        {DIMENSION_ORDER.map((key, index) => {
          const dim = data.dimensions?.[key];
          return (
            <DimensionCard
              key={key}
              name={DIMENSION_NAMES[key]}
              score={dim?.score ?? null}
              weight={dim?.weight || '—'}
              narrative={dim?.narrative || null}
              icon={DIMENSION_ICONS[key]}
              animDelay={`${0.05 * (index + 1)}s`}
            />
          );
        })}
      </div>

      {/* Responsive CSS */}
      <style>{`
        @media (max-width: 640px) {
          .dimension-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ReportCard;
