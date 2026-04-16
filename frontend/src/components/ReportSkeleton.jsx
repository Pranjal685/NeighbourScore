import React from 'react';
import { motion } from 'framer-motion';

function ReportSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ minHeight: '100vh', background: 'transparent' }}
    >
      {/* ── Navbar Skeleton ── */}
      <div className="glass-nav" style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '0 20px', height: 58,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div className="skeleton" style={{ width: 120, height: 20, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
      </div>

      {/* ── Content ── */}
      <div className="report-inner">

        {/* ── Score Hero Skeleton ── */}
        <div style={{ padding: '56px 0 48px' }}>
          <div className="hero-score-grid" style={{ marginBottom: 40 }}>
            {/* Left column */}
            <div>
              {/* Locality name */}
              <div className="skeleton" style={{ width: 300, height: 36, borderRadius: 8, marginBottom: 10 }} />
              {/* Subtext */}
              <div className="skeleton" style={{ width: 200, height: 16, borderRadius: 6, marginBottom: 32 }} />

              {/* Score display row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                {/* Gauge circle */}
                <div className="skeleton" style={{ width: 140, height: 140, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  {/* Score number */}
                  <div className="skeleton" style={{ width: 80, height: 60, borderRadius: 8, marginBottom: 8 }} />
                  {/* Badge */}
                  <div className="skeleton" style={{ width: 100, height: 28, borderRadius: 100 }} />
                </div>
              </div>
            </div>

            {/* Right column: radar placeholder */}
            <div className="glass-card radar-chart-panel" style={{ padding: '20px 16px 8px', borderRadius: 20 }}>
              <div className="skeleton" style={{ width: '95%', height: 280, borderRadius: 12 }} />
            </div>
          </div>
        </div>

        {/* ── Section Label ── */}
        <div style={{ marginBottom: 18 }}>
          <div className="skeleton" style={{ width: 200, height: 14, borderRadius: 6 }} />
        </div>

        {/* ── Dimension Cards Grid Skeleton ── */}
        <div className="tier1-grid" style={{ marginBottom: 20 }}>
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="tier2-grid" style={{ marginBottom: 20 }}>
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="tier3-grid" style={{ marginBottom: 40 }}>
          {[...Array(2)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* ── Map Placeholder ── */}
        <div className="skeleton map-bleed" style={{
          height: 320,
          borderRadius: 0,
          marginBottom: 48,
        }} />
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-card" style={{ padding: 20, borderRadius: 16 }}>
      {/* Header row: icon + name + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
        <div className="skeleton" style={{ flex: 1, height: 16, borderRadius: 6 }} />
        <div className="skeleton" style={{ width: 40, height: 20, borderRadius: 6, flexShrink: 0 }} />
      </div>
      {/* Progress bar */}
      <div className="skeleton" style={{ width: '100%', height: 4, borderRadius: 4, marginBottom: 14 }} />
      {/* Text lines */}
      <div className="skeleton" style={{ width: '80%', height: 12, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '90%', height: 12, borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 6 }} />
    </div>
  );
}

export default ReportSkeleton;
