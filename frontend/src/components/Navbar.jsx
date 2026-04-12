import React from 'react';
import { motion } from 'framer-motion';
import { Search, Share2, ChevronRight } from 'lucide-react';

function Navbar({ onNewSearch, locality }) {
  const parts = locality ? locality.split(',').map(p => p.trim()) : [];
  const city = parts.length > 1 ? parts[parts.length - 2] || 'Pune' : 'Pune';
  const area = parts[0] || '';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `NeighbourScore · ${area}`, url: window.location.href });
    } else {
      navigator.clipboard?.writeText(window.location.href);
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 32px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      {/* Logo */}
      <span style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 18,
        fontWeight: 700,
        color: '#1A1A2E',
        letterSpacing: '-0.02em',
        flexShrink: 0
      }}>
        <span style={{ color: 'var(--accent)' }}>N</span>eighbourScore
      </span>

      {/* Breadcrumb — center */}
      {locality && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: '#64748B',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <span>{city}</span>
          <ChevronRight size={12} />
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>{area}</span>
        </div>
      )}

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleShare}
          className="glass-chip"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            cursor: 'pointer',
            color: '#64748B',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          title="Share"
        >
          <Share2 size={13} />
        </button>

        <button
          onClick={onNewSearch}
          className="glass-chip"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#94A3B8',
            fontSize: 13,
            fontWeight: 500,
            padding: '7px 14px',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Search size={14} strokeWidth={1.5} />
          New Search
        </button>
      </div>
    </motion.nav>
  );
}

export default Navbar;
