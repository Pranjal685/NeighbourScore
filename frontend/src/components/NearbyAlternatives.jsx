import { motion } from 'framer-motion';
import { Navigation } from 'lucide-react';

function NearbyAlternatives({ alternatives, onSearch }) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div
      className="glass-card"
      style={{
      borderRadius: 16,
      padding: 24,
      marginTop: 32,
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#1A1A2E', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Navigation size={18} color="#6366F1" strokeWidth={1.5} /> Better Alternatives Nearby
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Areas within reach worth exploring
        </div>
      </div>

      {/* Cards row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 20,
        flexWrap: 'wrap',
      }}>
        {alternatives.map((alt, i) => (
          <motion.div
            key={alt.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.1 }}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            variants={{
              hover: {
                y: -6,
                boxShadow: '0 20px 40px rgba(99,102,241,0.15), 0 8px 16px rgba(0,0,0,0.1)',
                borderColor: 'rgba(99,102,241,0.3)',
                transition: { type: 'spring', stiffness: 400, damping: 25 }
              }
            }}
            onClick={() => onSearch && onSearch(alt.name + ', Pune')}
            className="glass-card"
            style={{
              borderRadius: 12,
              padding: '16px 20px',
              flex: '1 1 160px',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              minWidth: 150,
            }}
          >
            {/* Area name */}
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>
              {alt.name}
            </div>

            {/* Distance */}
            <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
              ~{alt.distance_km} km away
            </div>

            {/* Why better tag */}
            <div style={{
              display: 'inline-block',
              background: 'rgba(16,185,129,0.1)',
              color: '#10B981',
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              marginBottom: 12,
              lineHeight: 1.4,
            }}>
              {alt.why_better}
            </div>

            {/* CTA */}
            <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
              Analyze this area
              <motion.span variants={{ hover: { x: 4 } }}>→</motion.span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default NearbyAlternatives;
