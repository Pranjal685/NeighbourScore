import React from 'react';
import { motion } from 'framer-motion';

const CITIES = [
  { key: 'pune', label: 'Pune' },
  { key: 'mumbai', label: 'Mumbai' },
];

function CitySelector({ selectedCity, onCityChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.5)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.8)',
      padding: 3,
      gap: 2,
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      {CITIES.map(city => {
        const isActive = selectedCity === city.key;
        return (
          <motion.button
            key={city.key}
            onClick={() => onCityChange(city.key)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-pressed={isActive}
            aria-label={`Select ${city.label}`}
            style={{
              background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
              border: isActive ? '1.5px solid rgba(99,102,241,0.4)' : '1.5px solid transparent',
              borderRadius: 11,
              padding: '8px 22px',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#6366F1' : '#64748B',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
              boxShadow: isActive ? '0 4px 20px rgba(99,102,241,0.15)' : 'none',
            }}
          >
            {city.label}
          </motion.button>
        );
      })}
    </div>
  );
}

export default CitySelector;
