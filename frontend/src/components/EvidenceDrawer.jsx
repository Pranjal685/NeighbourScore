import React from 'react';

const drawerStyle = {
  borderTop: '1px solid rgba(0,0,0,0.06)',
  marginTop: 12,
  paddingTop: 14,
  background: 'rgba(255,255,255,0.3)',
  borderRadius: '0 0 12px 12px',
  padding: '14px 16px',
};

const sectionLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#E6A817',
  marginBottom: 8,
};

const valueText = {
  fontSize: 14,
  color: '#1A1A2E',
};

const mutedText = {
  fontSize: 12,
  color: '#64748B',
  marginTop: 4,
};

const badgeStyle = {
  display: 'inline-block',
  background: 'rgba(0,0,0,0.04)',
  color: '#64748B',
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 100,
  marginTop: 8,
};

function SourceBadge({ label }) {
  return <span style={badgeStyle}>{label}</span>;
}

// ─── AQI Scale Bar ───────────────────────────────────────────────────────────
const AQI_ZONES = [
  { max: 50,  label: 'Good',       color: '#3FB950' },
  { max: 100, label: 'Satisfactory', color: '#7BC67E' },
  { max: 150, label: 'Moderate',   color: '#E6A817' },
  { max: 200, label: 'Poor',       color: '#F0883E' },
  { max: 300, label: 'Very Poor',  color: '#F85149' },
  { max: 500, label: 'Severe',     color: '#8B1A1A' },
];

function getAqiZone(aqi) {
  for (const z of AQI_ZONES) {
    if (aqi <= z.max) return z;
  }
  return AQI_ZONES[AQI_ZONES.length - 1];
}

function AqiScaleBar({ aqi }) {
  const pct = Math.min(100, (aqi / 500) * 100);
  const zone = getAqiZone(aqi);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginBottom: 4 }}>
        <span>0 — Good</span><span>500 — Severe</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: zone.color,
          borderRadius: 4,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ fontSize: 12, color: zone.color, fontWeight: 600, marginTop: 5 }}>
        AQI {aqi} — {zone.label}
      </div>
    </div>
  );
}

// ─── News Card ───────────────────────────────────────────────────────────────
function NewsCard({ article }) {
  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const headline = article.title ? article.title.slice(0, 100) + (article.title.length > 100 ? '…' : '') : '';

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: 'rgba(255,255,255,0.4)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 8,
        padding: '10px 12px',
        marginBottom: 6,
        cursor: 'pointer',
        textDecoration: 'none',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.15)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'}
    >
      <div style={{ fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>{headline}</div>
      <div style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
        {article.source} &nbsp;·&nbsp; {date}
        <span style={{ float: 'right', opacity: 0.5 }}>↗</span>
      </div>
    </a>
  );
}

// ─── Per-dimension evidence renders ──────────────────────────────────────────

function AirQualityEvidence({ raw }) {
  const aqi = raw?.aqi ?? null;
  const isMissing = aqi === null || aqi === 0 || raw?.fallback;
  return (
    <div>
      <div style={sectionLabel}>Air Quality Index</div>
      {raw?.station_name && (
        <div style={mutedText}>Station: {raw.station_name}</div>
      )}
      {isMissing ? (
        <div style={{
          background: 'rgba(230,168,23,0.08)',
          border: '1px solid rgba(230,168,23,0.2)',
          borderRadius: 8,
          padding: '10px 12px',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 13, color: '#E6A817', fontWeight: 600 }}>
            Station data temporarily unavailable
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
            {raw?.note || 'The nearest CPCB station is not reporting a current reading. Score is based on a locality-level estimate.'}
          </div>
          {raw?.locality_matched && (
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              Estimate based on: {raw.locality_matched}
            </div>
          )}
        </div>
      ) : (
        <AqiScaleBar aqi={aqi} />
      )}
      <div style={{ ...mutedText, marginTop: 10 }}>
        Worst months: November, December, January
      </div>
      <SourceBadge label={isMissing ? 'Locality Estimate' : 'CPCB Real-time API'} />
    </div>
  );
}

function SchoolQualityEvidence({ raw }) {
  const count = raw?.count ?? null;
  const schools = raw?.schools || [];
  return (
    <div>
      <div style={sectionLabel}>Schools within 3 km</div>
      <div style={valueText}>{count !== null ? `${count} CBSE school${count !== 1 ? 's' : ''} found` : 'Count unavailable'}</div>
      {schools.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {schools.slice(0, 5).map((s, i) => (
            <div key={i} style={{
              fontSize: 12,
              color: '#94A3B8',
              padding: '5px 0',
              borderBottom: i < schools.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
            }}>
              <span style={{ fontWeight: 600 }}>{s.name || s}</span>
              {s.category && <span style={{ color: '#64748B', marginLeft: 6 }}>· {s.category}</span>}
              {s.distance && <span style={{ color: '#64748B', marginLeft: 6 }}>· {typeof s.distance === 'number' ? `${s.distance.toFixed(1)} km` : s.distance}</span>}
            </div>
          ))}
        </div>
      )}
      <SourceBadge label="CBSE Affiliation Database 2023" />
    </div>
  );
}

function FloodRiskEvidence({ raw }) {
  const inZone = raw?.in_flood_zone;
  const hazard = raw?.hazard_level || '';
  return (
    <div>
      <div style={sectionLabel}>NDMA Flood Hazard Assessment</div>
      {inZone ? (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8, padding: '10px 12px', marginBottom: 8
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 13, color: '#F87171', fontWeight: 600 }}>
              This locality falls in an NDMA classified flood hazard zone
            </span>
          </div>
          {hazard && (
            <span style={{ ...badgeStyle, background: 'rgba(239,68,68,0.1)', color: '#F87171' }}>
              Hazard Level: {hazard}
            </span>
          )}
          <div style={{ ...mutedText, marginTop: 8 }}>
            Flood risk areas experience inundation during heavy monsoon rainfall
          </div>
        </>
      ) : (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(63,185,80,0.08)',
            border: '1px solid rgba(63,185,80,0.2)',
            borderRadius: 8, padding: '10px 12px', marginBottom: 8
          }}>
            <span style={{ fontSize: 16 }}>✓</span>
            <span style={{ fontSize: 13, color: '#3FB950', fontWeight: 600 }}>
              Not in any NDMA flood hazard zone
            </span>
          </div>
          <div style={mutedText}>This locality has no recorded flood hazard classification</div>
        </>
      )}
      <SourceBadge label="NDMA Flood Hazard Atlas" />
    </div>
  );
}

function HealthcareEvidence({ raw }) {
  const count = raw?.count ?? null;
  const hospitals = raw?.hospitals || [];
  return (
    <div>
      <div style={sectionLabel}>Hospitals within 3 km</div>
      <div style={valueText}>{count !== null ? `${count} hospital${count !== 1 ? 's' : ''} & clinic${count !== 1 ? 's' : ''} found` : 'Count unavailable'}</div>
      {hospitals.length > 0 && (
        <div style={{ marginTop: 10 }}>
          {hospitals.slice(0, 5).map((h, i) => (
            <div key={i} style={{
              fontSize: 12,
              color: '#94A3B8',
              padding: '5px 0',
              borderBottom: i < hospitals.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
            }}>
              <span style={{ fontWeight: 600 }}>{h.name || h}</span>
              {h.rating && <span style={{ color: '#E6A817', marginLeft: 6 }}>★ {h.rating}</span>}
              {h.vicinity && <span style={{ color: '#64748B', marginLeft: 6 }}>· {h.vicinity}</span>}
            </div>
          ))}
        </div>
      )}
      <SourceBadge label="Google Maps Places API" />
    </div>
  );
}

function CrimeSafetyEvidence({ raw }) {
  const crimeRate = raw?.crime_rate ?? null;
  const totalCrimes = raw?.total_crimes ?? null;
  const news = raw?.recent_news || [];
  const comparison = crimeRate != null
    ? crimeRate > 500
      ? `${Math.round(((crimeRate - 450) / 450) * 100)}% above Maharashtra average`
      : crimeRate < 400
        ? `${Math.round(((450 - crimeRate) / 450) * 100)}% below Maharashtra average`
        : 'Near Maharashtra average'
    : null;
  const compColor = crimeRate != null
    ? crimeRate > 500 ? '#F87171' : crimeRate < 400 ? '#3FB950' : '#E6A817'
    : 'var(--text-muted)';

  return (
    <div>
      <div style={sectionLabel}>NCRB Crime Statistics</div>
      {crimeRate !== null && (
        <div style={valueText}>{Math.round(crimeRate).toLocaleString('en-IN')} crimes per 100,000 population</div>
      )}
      {totalCrimes !== null && (
        <div style={mutedText}>{totalCrimes.toLocaleString('en-IN')} total reported crimes</div>
      )}
      {comparison && (
        <div style={{ fontSize: 12, color: compColor, fontWeight: 600, marginTop: 6 }}>
          {comparison}
        </div>
      )}
      <SourceBadge label="NCRB Crime in India 2023" />

      <div style={{ marginTop: 14 }}>
        <div style={sectionLabel}>Recent News</div>
        {news.length === 0 ? (
          // FIX 4 — fallback when no relevant local news found
          <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
            No recent local crime news found for this area.
            Data based on NCRB 2023 annual report.
          </div>
        ) : (
          <>
            {news.slice(0, 3).map((article, i) => (
              <NewsCard key={i} article={article} />
            ))}
            {/* FIX 4 — disclaimer below news items */}
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 6 }}>
              News sourced from Indian publications. Verify before making decisions.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TransportEvidence({ raw }) {
  const count = raw?.count ?? null;
  const stops = raw?.stops || [];
  return (
    <div>
      <div style={sectionLabel}>PMPML Bus Stops within 500 m</div>
      <div style={valueText}>{count !== null ? `${count} bus stop${count !== 1 ? 's' : ''} found` : 'Count unavailable'}</div>
      {stops.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {stops.slice(0, 5).map((s, i) => (
            <div key={i} style={{ fontSize: 12, color: '#94A3B8', padding: '3px 0' }}>
              · {typeof s === 'string' ? s : s.name || s}
            </div>
          ))}
        </div>
      )}
      <div style={{ ...mutedText, marginTop: 8 }}>
        Areas with 5+ bus stops within 500 m have excellent connectivity
      </div>
      <SourceBadge label="Google Maps Places API" />
    </div>
  );
}

function PropertyValueEvidence({ raw, score }) {
  const price = raw?.price_per_sqft;
  const trend = raw?.trend_12m_pct;
  const freshness = raw?.data_freshness || 'cached';
  const source = raw?.source || 'aggregated_2024';
  const trendColor = trend != null ? (trend > 0 ? '#3FB950' : '#F85149') : 'var(--text-muted)';
  const trendArrow = trend != null ? (trend > 0 ? '↑' : '↓') : '';

  return (
    <div>
      <div style={sectionLabel}>Property Market</div>
      {price != null && (
        <div style={{ fontSize: 22, fontWeight: 800, color: '#1A1A2E', letterSpacing: '-0.03em' }}>
          ₹{price.toLocaleString('en-IN')} <span style={{ fontSize: 14, fontWeight: 400, color: '#64748B' }}>/ sqft</span>
        </div>
      )}
      {trend != null && (
        <div style={{ fontSize: 14, color: trendColor, fontWeight: 600, marginTop: 4 }}>
          {trendArrow} {Math.abs(trend)}% in 12 months
        </div>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          ...badgeStyle,
          background: freshness === 'live' ? 'rgba(63,185,80,0.1)' : 'rgba(0,0,0,0.06)',
          color: freshness === 'live' ? '#3FB950' : 'var(--text-muted)',
        }}>
          {freshness === 'live' ? '🟢 Live data 2026' : '📅 Estimated 2024'}
        </span>
        <SourceBadge label={source === 'gemini_search_2026' ? 'Gemini Search 2026' : 'Aggregated Market Data'} />
      </div>
    </div>
  );
}

function GreeneryEvidence({ raw, score }) {
  const count = raw?.count ?? null;
  const parks = raw?.parks || [];
  const coverLabel = score >= 80 ? 'High' : score >= 60 ? 'Moderate' : 'Low';
  const coverColor = score >= 80 ? '#3FB950' : score >= 60 ? '#E6A817' : '#F85149';

  return (
    <div>
      <div style={sectionLabel}>Parks within 1 km</div>
      <div style={valueText}>{count !== null ? `${count} park${count !== 1 ? 's' : ''} & green space${count !== 1 ? 's' : ''}` : 'Count unavailable'}</div>
      {parks.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {parks.slice(0, 5).map((p, i) => (
            <div key={i} style={{ fontSize: 12, color: '#94A3B8', padding: '3px 0' }}>
              · {typeof p === 'string' ? p : p.name || p}
            </div>
          ))}
        </div>
      )}
      <div style={{ ...mutedText, marginTop: 8 }}>
        Green cover index:{' '}
        <span style={{ color: coverColor, fontWeight: 600 }}>{coverLabel}</span>
      </div>
      <SourceBadge label="Google Maps + OpenStreetMap" />
    </div>
  );
}

// ─── Main EvidenceDrawer ──────────────────────────────────────────────────────

function EvidenceDrawer({ dimensionKey, raw, score }) {
  return (
    <div style={drawerStyle}>
      {dimensionKey === 'air_quality'    && <AirQualityEvidence raw={raw} />}
      {dimensionKey === 'school_quality' && <SchoolQualityEvidence raw={raw} />}
      {dimensionKey === 'flood_risk'     && <FloodRiskEvidence raw={raw} />}
      {dimensionKey === 'healthcare'     && <HealthcareEvidence raw={raw} />}
      {dimensionKey === 'crime_safety'   && <CrimeSafetyEvidence raw={raw} />}
      {dimensionKey === 'transport'      && <TransportEvidence raw={raw} />}
      {dimensionKey === 'property_value' && <PropertyValueEvidence raw={raw} score={score} />}
      {dimensionKey === 'greenery'       && <GreeneryEvidence raw={raw} score={score} />}
    </div>
  );
}

export default EvidenceDrawer;
