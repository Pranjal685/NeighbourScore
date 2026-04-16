import React from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

function NotFoundPage({ onGoHome }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      {/* Background blobs */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '-150px',
          left: '-150px',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230,168,23,0.12) 0%, transparent 70%)',
          bottom: '-100px',
          right: '-100px',
          filter: 'blur(40px)',
        }} />
      </div>

      {/* Logo */}
      <div style={{
        position: 'absolute',
        top: 22,
        left: 32,
        fontFamily: 'var(--font-heading)',
        fontSize: 18,
        fontWeight: 700,
        color: '#1A1A2E',
        zIndex: 1,
      }}>
        <span style={{ color: 'var(--accent)' }}>N</span>eighbourScore
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 400 }}>
        {/* 404 number with bounce animation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
          style={{
            fontSize: 120,
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: '#6366F1',
            lineHeight: 1,
            letterSpacing: '-0.05em',
            marginBottom: 4,
          }}
        >
          404
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#64748B',
            marginTop: 8,
            marginBottom: 12,
            fontFamily: 'var(--font-body)',
          }}
        >
          Report not found
        </motion.h1>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{
            fontSize: 13,
            color: '#94A3B8',
            maxWidth: 360,
            textAlign: 'center',
            lineHeight: 1.7,
            margin: '0 auto 32px',
          }}
        >
          This report link may have expired or never existed.
          Search any Pune locality to generate a fresh report.
        </motion.p>

        {/* CTA Button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          onClick={onGoHome}
          className="gradient-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 28px',
            fontSize: 14,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(99,102,241,0.5)' }}
          whileTap={{ scale: 0.98 }}
        >
          <Search size={16} strokeWidth={2} />
          Search a locality
        </motion.button>
      </div>
    </motion.div>
  );
}

export default NotFoundPage;
