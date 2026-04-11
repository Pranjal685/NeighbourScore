import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

const DIMENSION_LABELS = {
  air_quality: 'Air',
  school_quality: 'Schools',
  flood_risk: 'Flood',
  healthcare: 'Health',
  crime_safety: 'Crime',
  transport: 'Transit',
  property_value: 'Property',
  greenery: 'Green'
};

const ORDER = ['air_quality', 'school_quality', 'flood_risk', 'healthcare', 'crime_safety', 'transport', 'property_value', 'greenery'];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#161B22',
      border: '1px solid rgba(240,246,252,0.1)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
      color: '#E6EDF3',
      fontFamily: 'var(--font-body)'
    }}>
      <div style={{ fontWeight: 600 }}>{payload[0]?.payload?.dimension}</div>
      <div style={{ color: '#E6A817', marginTop: 2 }}>{payload[0]?.value}/100</div>
    </div>
  );
}

function NeighbourRadarChart({ dimensions, color = '#E6A817', secondDimensions, secondColor = '#3FB950' }) {
  const data = ORDER.map(key => ({
    dimension: DIMENSION_LABELS[key],
    score: Math.max(dimensions?.[key]?.score ?? 50, 20),
    score2: secondDimensions ? Math.max(secondDimensions?.[key]?.score ?? 50, 20) : undefined,
    fullMark: 100
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={data} margin={{ top: 10, right: 28, bottom: 10, left: 28 }}>
        <PolarGrid
          stroke="rgba(240,246,252,0.06)"
          gridType="polygon"
        />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{
            fill: '#8B949E',
            fontSize: 12,
            fontFamily: 'DM Sans, sans-serif'
          }}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke={color}
          fill={color}
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ fill: color, r: 3, strokeWidth: 0 }}
        />
        {secondDimensions && (
          <Radar
            name="Compare"
            dataKey="score2"
            stroke={secondColor}
            fill={secondColor}
            fillOpacity={0.1}
            strokeWidth={2}
            dot={{ fill: secondColor, r: 3, strokeWidth: 0 }}
          />
        )}
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export default NeighbourRadarChart;
