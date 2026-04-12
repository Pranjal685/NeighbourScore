import { Tier1Card, Tier2Card, Tier3Card } from './DimensionCard';
import { TrendingUp, BarChart2, Info } from 'lucide-react';

// Tier 1 — highest weight + most important for family decision
const TIER1 = ['school_quality', 'air_quality', 'flood_risk'];
// Tier 2 — medium weight
const TIER2 = ['healthcare', 'crime_safety', 'transport'];
// Tier 3 — supporting context
const TIER3 = ['property_value', 'greenery'];

const NAMES = {
  air_quality:    'Air Quality',
  school_quality: 'School Quality',
  flood_risk:     'Flood Risk',
  healthcare:     'Healthcare',
  crime_safety:   'Crime Safety',
  transport:      'Transport',
  property_value: 'Property Value',
  greenery:       'Greenery & Parks',
};

function SectionLabel({ children, Icon, style }) {
  return (
    <div style={{
      fontSize: 12,
      fontWeight: 700,
      color: 'var(--accent)',
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      marginBottom: 16,
      marginTop: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      ...style
    }}>
      {Icon && <Icon size={14} color="var(--accent)" strokeWidth={1.5} />}
      {children}
    </div>
  );
}

function DimensionGrid({ dimensions }) {
  const get = key => dimensions?.[key];

  return (
    <div>
      {/* TIER 1 */}
      <SectionLabel Icon={TrendingUp}>Core Dimensions — Highest Impact</SectionLabel>
      <div className="tier1-grid">
        {TIER1.map((key, i) => {
          const d = get(key);
          return (
            <Tier1Card
              key={key}
              dimensionKey={key}
              name={NAMES[key]}
              score={d?.score ?? null}
              weight={d?.weight || '—'}
              narrative={d?.narrative || null}
              raw={d?.raw || null}
              index={i}
            />
          );
        })}
      </div>

      {/* TIER 2 */}
      <SectionLabel style={{ marginTop: 24 }} Icon={BarChart2}>Supporting Dimensions</SectionLabel>
      <div className="tier2-grid">
        {TIER2.map((key, i) => {
          const d = get(key);
          return (
            <Tier2Card
              key={key}
              dimensionKey={key}
              name={NAMES[key]}
              score={d?.score ?? null}
              weight={d?.weight || '—'}
              narrative={d?.narrative || null}
              raw={d?.raw || null}
              index={i}
            />
          );
        })}
      </div>

      {/* TIER 3 */}
      <SectionLabel style={{ marginTop: 24 }} Icon={Info}>Contextual Indicators</SectionLabel>
      <div className="tier3-grid">
        {TIER3.map((key, i) => {
          const d = get(key);
          return (
            <Tier3Card
              key={key}
              dimensionKey={key}
              name={NAMES[key]}
              score={d?.score ?? null}
              weight={d?.weight || '—'}
              narrative={d?.narrative || null}
              raw={d?.raw || null}
              index={i}
            />
          );
        })}
      </div>
    </div>
  );
}

export default DimensionGrid;
