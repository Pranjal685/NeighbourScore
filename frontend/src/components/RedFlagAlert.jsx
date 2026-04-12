import React from 'react';
import { motion } from 'framer-motion';

function getRedFlags(dimensions) {
  if (!dimensions) return [];
  const flags = [];

  if ((dimensions.flood_risk?.score ?? 100) < 45) {
    flags.push({
      dimension: 'Flood Risk',
      icon: '🌊',
      message: 'This locality falls in an NDMA flood hazard zone',
      severity: 'high',
    });
  }

  if ((dimensions.crime_safety?.score ?? 100) < 45) {
    flags.push({
      dimension: 'Crime Safety',
      icon: '🛡️',
      message: 'Crime rate is significantly above Pune district average',
      severity: 'high',
    });
  }

  if ((dimensions.air_quality?.score ?? 100) < 45) {
    flags.push({
      dimension: 'Air Quality',
      icon: '🌬️',
      message: 'AQI levels in this area are Poor to Very Poor',
      severity: 'high',
    });
  }

  if ((dimensions.school_quality?.score ?? 100) < 45) {
    flags.push({
      dimension: 'School Quality',
      icon: '🏫',
      message: 'Fewer than 3 CBSE schools found within 3 km',
      severity: 'medium',
    });
  }

  if ((dimensions.transport?.score ?? 100) < 45) {
    flags.push({
      dimension: 'Transport',
      icon: '🚌',
      message: 'Very limited public transport connectivity',
      severity: 'medium',
    });
  }

  if ((dimensions.healthcare?.score ?? 100) < 45) {
    flags.push({
      dimension: 'Healthcare',
      icon: '🏥',
      message: 'Limited hospital access within 3 km radius',
      severity: 'medium',
    });
  }

  return flags;
}

function SeverityBadge({ severity }) {
  const isHigh = severity === 'high';
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 100,
      background: isHigh ? 'rgba(239,68,68,0.15)' : 'rgba(230,168,23,0.15)',
      color: isHigh ? '#F87171' : '#E6A817',
      flexShrink: 0,
    }}>
      {isHigh ? 'High Risk' : 'Medium Risk'}
    </span>
  );
}

function RedFlagAlert({ dimensions }) {
  const flags = getRedFlags(dimensions);

  if (flags.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#F87171' }}>Red Flags Detected</span>
        </div>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 100,
          background: 'rgba(239,68,68,0.12)',
          color: '#F87171',
        }}>
          {flags.length} issue{flags.length > 1 ? 's' : ''} found
        </span>
      </div>

      {/* Flag rows */}
      {flags.map((flag, i) => (
        <div key={i} style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1 }}>
            <span style={{ fontSize: 16, lineHeight: 1.3, flexShrink: 0 }}>{flag.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F87171', lineHeight: 1.3 }}>
                {flag.dimension}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                {flag.message}
              </div>
            </div>
          </div>
          <SeverityBadge severity={flag.severity} />
        </div>
      ))}
    </motion.div>
  );
}

export default RedFlagAlert;
