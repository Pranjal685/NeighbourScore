import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy } from 'lucide-react';
import ProfileSelector from '../components/ProfileSelector';

const LOCALITIES = [
  { rank: 1,  name: 'Koregaon Park', score: 80, tier: 'Premium',    lat: 18.5362, lng: 73.8937 },
  { rank: 2,  name: 'Kalyani Nagar', score: 77, tier: 'Premium',    lat: 18.5467, lng: 73.9008 },
  { rank: 3,  name: 'Baner',         score: 76, tier: 'Premium',    lat: 18.5590, lng: 73.7868 },
  { rank: 4,  name: 'Kothrud',       score: 75, tier: 'Premium',    lat: 18.5074, lng: 73.8077 },
  { rank: 5,  name: 'Aundh',         score: 73, tier: 'Good',       lat: 18.5589, lng: 73.8078 },
  { rank: 6,  name: 'Viman Nagar',   score: 71, tier: 'Good',       lat: 18.5679, lng: 73.9143 },
  { rank: 7,  name: 'Magarpatta',    score: 70, tier: 'Good',       lat: 18.5136, lng: 73.9271 },
  { rank: 8,  name: 'Kharadi',       score: 67, tier: 'Good',       lat: 18.5515, lng: 73.9456 },
  { rank: 9,  name: 'Hinjewadi',     score: 66, tier: 'Developing', lat: 18.5912, lng: 73.7385 },
  { rank: 10, name: 'Hadapsar',      score: 64, tier: 'Developing', lat: 18.4996, lng: 73.9397 },
  { rank: 11, name: 'Kondhwa',       score: 61, tier: 'Developing', lat: 18.4647, lng: 73.8973 },
  { rank: 12, name: 'Katraj',        score: 60, tier: 'Developing', lat: 18.4524, lng: 73.8468 },
  { rank: 13, name: 'Wakad',         score: 58, tier: 'Developing', lat: 18.5974, lng: 73.7898 },
  { rank: 14, name: 'Wagholi',       score: 55, tier: 'Developing', lat: 18.5788, lng: 73.9796 },
  { rank: 15, name: 'Dhanori',       score: 50, tier: 'Developing', lat: 18.5997, lng: 73.9101 },
];

const TIER_COLORS = {
  Premium:    { text: '#10B981', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.25)' },
  Good:       { text: '#E6A817', bg: 'rgba(230,168,23,0.10)', border: 'rgba(230,168,23,0.25)' },
  Developing: { text: '#EF4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)'  },
};

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const FILTER_TABS = ['All', 'Premium', 'Good', 'Developing'];

const PROFILE_LABELS = {
  family: 'Family',
  professional: 'Professional',
  retiree: 'Retiree',
  investor: 'Investor',
};

function LeaderboardPage({ onSearch, onGoHome }) {
  const [selectedProfile, setSelectedProfile] = useState('general');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = activeFilter === 'All'
    ? LOCALITIES
    : LOCALITIES.filter(l => l.tier === activeFilter);

  const handleAnalyze = (loc) => {
    if (onSearch) {
      onSearch(loc.lat, loc.lng, loc.name + ', Pune, Maharashtra, India', selectedProfile);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{ minHeight: '100vh', background: 'transparent' }}
    >
      {/* Nav */}
      <div
        className="glass-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 100,
          padding: '0 20px', height: 58,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700,
            color: '#1A1A2E', letterSpacing: '-0.02em',
          }}
        >
          <span style={{ color: '#6366F1' }}>N</span>eighbourScore
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: '#6366F1',
            background: 'rgba(99,102,241,0.08)',
            padding: '5px 14px', borderRadius: 100,
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <Trophy size={13} strokeWidth={2} />
            Leaderboard
          </span>

          <button
            onClick={onGoHome}
            className="glass-chip"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              color: '#94A3B8', fontSize: 13, fontWeight: 500,
              padding: '7px 14px', cursor: 'pointer',
              fontFamily: 'var(--font-body)', minHeight: 34,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1A1A2E'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            <span className="nav-search-text">Back</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="section-inner" style={{ paddingTop: 48, paddingBottom: 80 }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          style={{ marginBottom: 36 }}
        >
          <div style={{
            fontSize: 12, color: '#6366F1', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12,
          }}>
            Pune Rankings
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 700, color: '#1A1A2E',
            letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12,
          }}>
            Pune Neighborhood Leaderboard
          </h1>
          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.65 }}>
            15 localities ranked by NeighbourScore · Validated across 52 tests · Click any row to analyze
          </p>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="glass-card"
          style={{ display: 'flex', marginBottom: 28, overflow: 'hidden' }}
        >
          {[
            { label: 'Localities Ranked', value: '15',  icon: '🏙️', sub: null },
            { label: 'Top Score',         value: '80',  icon: '🥇', sub: 'Koregaon Park' },
            { label: 'Lowest Score',      value: '50',  icon: '📍', sub: 'Dhanori' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1, padding: '20px 16px', textAlign: 'center',
                borderRight: i < 2 ? '1px solid rgba(255,255,255,0.85)' : 'none',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{
                fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                color: '#6366F1', letterSpacing: '-0.02em', lineHeight: 1,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{stat.label}</div>
              {stat.sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{stat.sub}</div>}
            </div>
          ))}
        </motion.div>

        {/* Profile selector */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.13 }}
          className="glass-card"
          style={{ padding: '20px 24px', marginBottom: 20 }}
        >
          <ProfileSelector selectedProfile={selectedProfile} onProfileChange={setSelectedProfile} />
          {selectedProfile === 'general'
            ? <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 12, lineHeight: 1.55 }}>
                Scores above use General weights. Select a profile and click Analyze to see your personalized result.
              </p>
            : <p style={{ fontSize: 12, color: '#6366F1', marginTop: 12, fontWeight: 500, lineHeight: 1.55 }}>
                Click Analyze on any locality to see your {PROFILE_LABELS[selectedProfile]} score calculated live.
              </p>
          }
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}
        >
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab;
            const tc = tab !== 'All' ? TIER_COLORS[tab] : null;
            return (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                style={{
                  padding: '8px 20px', borderRadius: 100,
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                  background: isActive
                    ? (tc ? tc.bg : 'rgba(99,102,241,0.10)')
                    : 'rgba(255,255,255,0.50)',
                  border: `1.5px solid ${isActive
                    ? (tc ? tc.border : 'rgba(99,102,241,0.40)')
                    : 'rgba(255,255,255,0.80)'}`,
                  color: isActive
                    ? (tc ? tc.text : '#6366F1')
                    : '#64748B',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {tab}
              </button>
            );
          })}
        </motion.div>

        {/* Leaderboard table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="glass-card"
          style={{ overflow: 'hidden' }}
        >
          {/* Table header */}
          <div
            className="leaderboard-header"
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.85)',
              fontSize: 10, fontWeight: 700,
              color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}
          >
            <span>Rank</span>
            <span>Locality</span>
            <span style={{ textAlign: 'right' }}>
              Score
              <span style={{
                display: 'block', fontSize: 8, color: '#94A3B8',
                fontWeight: 500, letterSpacing: '0.04em',
                textTransform: 'none', marginTop: 1,
              }}>
                (General)
              </span>
            </span>
            <span className="lb-hide-mobile" />
            <span className="lb-hide-mobile">Tier</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {/* Rows */}
          {filtered.map((loc, i) => {
            const tc = TIER_COLORS[loc.tier];
            return (
              <motion.div
                key={loc.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28, delay: 0.24 + i * 0.035 }}
                onClick={() => handleAnalyze(loc)}
                className="leaderboard-row leaderboard-header"
                style={{
                  padding: '15px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                whileHover={{ backgroundColor: 'rgba(99,102,241,0.04)' }}
              >
                {/* Rank */}
                <div>
                  {RANK_MEDALS[loc.rank]
                    ? <span style={{ fontSize: 22, lineHeight: 1 }}>{RANK_MEDALS[loc.rank]}</span>
                    : <span style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 800,
                        fontSize: 16, color: '#64748B',
                      }}>
                        {String(loc.rank).padStart(2, '0')}
                      </span>
                  }
                </div>

                {/* Name */}
                <div style={{
                  fontWeight: 700, fontSize: 15, color: '#1A1A2E',
                  letterSpacing: '-0.01em', paddingRight: 8,
                }}>
                  {loc.name}
                </div>

                {/* Score */}
                <div style={{
                  textAlign: 'right',
                  fontSize: 20, fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: tc.text, letterSpacing: '-0.02em',
                }}>
                  {loc.score}
                </div>

                {/* Score bar — hidden on mobile */}
                <div className="lb-hide-mobile" style={{ padding: '0 12px' }}>
                  <div style={{
                    height: 6, background: 'rgba(0,0,0,0.07)',
                    borderRadius: 3, overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${loc.score}%` }}
                      transition={{ duration: 0.9, delay: 0.3 + i * 0.04, ease: 'easeOut' }}
                      style={{ height: '100%', background: tc.text, borderRadius: 3 }}
                    />
                  </div>
                </div>

                {/* Tier badge — hidden on mobile */}
                <div className="lb-hide-mobile">
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 11px', borderRadius: 100,
                    fontSize: 11, fontWeight: 700,
                    background: tc.bg, color: tc.text,
                    border: `1px solid ${tc.border}`,
                    whiteSpace: 'nowrap',
                  }}>
                    {loc.tier}
                  </span>
                </div>

                {/* Analyze button */}
                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAnalyze(loc); }}
                    style={{
                      padding: '7px 12px',
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.20)',
                      borderRadius: 10,
                      fontSize: 12, fontWeight: 600,
                      color: '#6366F1', cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                      transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.40)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(99,102,241,0.08)';
                      e.currentTarget.style.borderColor = 'rgba(99,102,241,0.20)';
                    }}
                  >
                    Analyze →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Footer note */}
        <p style={{
          fontSize: 12, color: '#94A3B8',
          textAlign: 'center', marginTop: 24, lineHeight: 1.65,
        }}>
          Scores calculated using General profile weights. Switch profiles on the report page to personalize.
        </p>
      </div>
    </motion.div>
  );
}

export default LeaderboardPage;
