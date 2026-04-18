import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Autocomplete } from '@react-google-maps/api';
import { Search, Loader2, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getScore } from '../services/api';
import NeighbourRadarChart from './RadarChart';

function safeGtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

const COMPARE_DIMENSIONS = [
  { key: 'air_quality', label: 'Air Quality' },
  { key: 'school_quality', label: 'Schools' },
  { key: 'flood_risk', label: 'Flood Risk' },
  { key: 'healthcare', label: 'Healthcare' },
  { key: 'crime_safety', label: 'Crime Safety' },
  { key: 'transport', label: 'Transport' },
  { key: 'property_value', label: 'Property' },
  { key: 'greenery', label: 'Greenery' },
];

function getScoreColor(score) {
  if (score >= 80) return '#3FB950';
  if (score >= 60) return '#E6A817';
  return '#F85149';
}

const PROFILE_BANNER_PREFIX = {
  family:       'For families',
  professional: 'For professionals',
  retiree:      'For retirees',
  investor:     'For investors',
  general:      null,
};

function CompareMode({ firstResult, profile = 'general' }) {
  const [secondResult, setSecondResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const autocompleteRef = useRef(null);

  const onLoad = (autocomplete) => { autocompleteRef.current = autocomplete; };

  const onPlaceChanged = async () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const name = place.formatted_address || place.name;
      setInputValue(name);
      setIsLoading(true);
      try {
        const [data] = await Promise.all([
          getScore(lat, lng, name, profile),
          new Promise(r => setTimeout(r, 1000))
        ]);
        setSecondResult(data);
        safeGtag('event', 'localities_compared', {
          locality_1: firstResult?.locality || '',
          locality_2: name,
        });
      } catch (err) {
        console.error('Compare failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const first = firstResult;
  const second = secondResult;
  const firstName = (first?.locality || '').split(',')[0].trim();
  const secondName = second ? (second.locality || '').split(',')[0].trim() : '';

  let winner = null, loser = null;
  if (first && second) {
    if (second.composite >= first.composite) {
      winner = second; loser = first;
    } else {
      winner = first; loser = second;
    }
  }

  const topDimensions = winner && loser
    ? COMPARE_DIMENSIONS
        .filter(d => (winner.dimensions?.[d.key]?.score || 0) > (loser.dimensions?.[d.key]?.score || 0))
        .slice(0, 3)
        .map(d => d.label)
    : [];

  const winnerName = winner === second ? secondName : firstName;
  const loserComposite = loser?.composite || 0;
  const winnerComposite = winner?.composite || 0;
  const bannerPrefix = PROFILE_BANNER_PREFIX[profile];

  return (
    <div style={{ marginTop: 40 }}>
      <div 
        className="glass-card"
        style={{
        borderRadius: 20,
        padding: '24px'
      }}>
        <h3 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 16,
          fontWeight: 700,
          color: '#1A1A2E',
          marginBottom: 16,
          letterSpacing: '-0.02em'
        }}>
          Compare Localities
        </h3>

        {/* Search bar */}
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'in' },
            bounds: { north: 18.65, south: 18.40, east: 74.00, west: 73.70 }
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
            border: `1px solid ${isFocused ? 'rgba(230,168,23,0.4)' : 'var(--border)'}`,
            borderRadius: 10,
            padding: '9px 12px',
            gap: 8,
            transition: 'border-color 0.2s',
            boxShadow: isFocused ? '0 0 0 3px rgba(230,168,23,0.08)' : 'none'
          }}>
            <Search size={14} color={isFocused ? '#E6A817' : 'var(--text-muted)'} />
            <input
              type="text"
              placeholder="Search second locality to compare..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#1A1A2E',
                fontSize: 13,
                flex: 1,
                fontFamily: 'var(--font-body)'
              }}
            />
            {isLoading && (
              <Loader2 size={14} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            )}
          </div>
        </Autocomplete>

        <AnimatePresence>
          {second && (
            <motion.div
              initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
              animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
            >
              {/* Winner banner */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{
                  marginTop: 20,
                  background: 'rgba(63,185,80,0.08)',
                  border: '1px solid rgba(63,185,80,0.3)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  marginBottom: 20
                }}
              >
                <Trophy size={14} color="#3FB950" style={{ marginTop: 2, flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#3FB950', margin: 0, lineHeight: 1.55 }}>
                  {bannerPrefix && (
                    <><strong style={{ color: '#E6A817' }}>{bannerPrefix}:</strong>{' '}</>
                  )}
                  <strong style={{ color: '#1A1A2E' }}>{winnerName}</strong>{' '}
                  scores {winnerComposite} vs{' '}
                  <strong style={{ color: '#1A1A2E' }}>
                    {winner === second ? firstName : secondName}
                  </strong>{' '}
                  scores {loserComposite}
                  {topDimensions.length > 0 && (
                    <> — wins on{' '}
                      <strong style={{ color: '#1A1A2E' }}>
                        {topDimensions.join(', ')}
                      </strong>
                    </>
                  )}
                </p>
              </motion.div>

              {/* Overlay radar chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card"
                style={{
                  borderRadius: 14,
                  padding: '16px',
                  marginBottom: 16
                }}
              >
                <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 2, background: '#E6A817', display: 'inline-block', borderRadius: 1 }} />
                    {firstName}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 2, background: '#3FB950', display: 'inline-block', borderRadius: 1 }} />
                    {secondName}
                  </span>
                </div>
                <NeighbourRadarChart
                  dimensions={first.dimensions}
                  secondDimensions={second.dimensions}
                  color="#E6A817"
                  secondColor="#3FB950"
                />
              </motion.div>

              {/* Two-column compare cards */}
              <div className="compare-grid">
                <CompareCard name={firstName} data={first} isWinner={winner === first} otherData={second} />
                <CompareCard name={secondName} data={second} isWinner={winner === second} otherData={first} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CompareCard({ name, data, isWinner, otherData }) {
  const composite = data.composite || 0;
  const color = getScoreColor(composite);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: isWinner ? 'rgba(63,185,80,0.08)' : 'var(--bg-elevated)',
        border: isWinner ? '1px solid rgba(63,185,80,0.3)' : '1px solid var(--border)',
        borderRadius: 14,
        padding: '20px'
      }}
    >
      {isWinner && (
        <span style={{
          background: 'rgba(63,185,80,0.15)',
          color: '#3FB950',
          fontSize: 10,
          fontWeight: 700,
          padding: '2px 10px',
          borderRadius: 100,
          display: 'inline-block',
          marginBottom: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>
          Winner
        </span>
      )}

      <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', marginBottom: 4 }}>
        {name}
      </div>
      <div style={{
        fontSize: 52,
        fontWeight: 800,
        fontFamily: 'var(--font-heading)',
        color: color,
        lineHeight: 1,
        marginBottom: 16
      }}>
        {composite}
      </div>

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />

      {COMPARE_DIMENSIONS.map(dim => {
        const myScore = data.dimensions?.[dim.key]?.score;
        const otherScore = otherData.dimensions?.[dim.key]?.score;
        const isBetter = (myScore || 0) > (otherScore || 0);
        const isTie = myScore === otherScore;
        const display = myScore != null ? Math.max(myScore, 20) : '—';

        return (
          <div key={dim.key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px 0',
            borderBottom: '1px solid var(--border)'
          }}>
            <span style={{ fontSize: 11.5, color: '#64748B' }}>{dim.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {!isTie && isBetter && <TrendingUp size={10} color="#3FB950" />}
              {!isTie && !isBetter && <TrendingDown size={10} color="#F85149" />}
              {isTie && <Minus size={10} color="#94A3B8" />}
              <span style={{
                fontSize: 11.5,
                fontWeight: 600,
                color: isTie ? '#64748B' : isBetter ? '#3FB950' : '#F85149'
              }}>
                {display}
              </span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

export default CompareMode;
