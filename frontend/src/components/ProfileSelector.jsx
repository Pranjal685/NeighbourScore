import React from 'react';
import { motion } from 'framer-motion';

const PROFILES = [
  {
    key: 'family',
    icon: '👨‍👩‍👧',
    title: 'Family',
    subtitle: 'Schools & safety first',
  },
  {
    key: 'professional',
    icon: '💼',
    title: 'Professional',
    subtitle: 'Commute & investment',
  },
  {
    key: 'retiree',
    icon: '🧓',
    title: 'Retiree',
    subtitle: 'Healthcare & greenery',
  },
  {
    key: 'investor',
    icon: '🏠',
    title: 'Investor',
    subtitle: 'Price trends & growth',
  },
];

function ProfileSelector({ selectedProfile, onProfileChange }) {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{
        fontSize: 13,
        color: 'var(--text-muted)',
        marginBottom: 12,
        letterSpacing: '0.02em'
      }}>
        Personalize your score <span style={{ opacity: 0.6 }}>(optional)</span>
      </div>

      <div className="profile-grid">
        {PROFILES.map(p => {
          const isSelected = selectedProfile === p.key;
          return (
            <motion.button
              key={p.key}
              onClick={() => onProfileChange(isSelected ? 'general' : p.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                background: isSelected ? 'rgba(230,168,23,0.08)' : 'var(--bg-surface)',
                border: isSelected ? '2px solid #E6A817' : '1px solid rgba(240,246,252,0.1)',
                borderRadius: 12,
                padding: '14px 10px',
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 6, lineHeight: 1 }}>{p.icon}</div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: isSelected ? '#E6A817' : 'var(--text-secondary)',
                marginBottom: 3,
                transition: 'color 0.15s',
              }}>
                {p.title}
              </div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}>
                {p.subtitle}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default ProfileSelector;
