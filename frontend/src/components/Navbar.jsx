import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, ChevronRight } from 'lucide-react';

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
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(13,17,23,0.90)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid var(--border)',
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
        color: 'var(--text-primary)',
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
          color: 'var(--text-muted)',
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <span>{city}</span>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{area}</span>
        </div>
      )}

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleShare}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            cursor: 'pointer',
            color: 'var(--text-muted)',
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            fontWeight: 500,
            padding: '7px 14px',
            borderRadius: 8,
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-mid)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <ArrowLeft size={12} />
          New Search
        </button>
      </div>
    </motion.nav>
  );
}

export default Navbar;
