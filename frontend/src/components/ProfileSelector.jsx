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
        color: '#64748B',
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
                background: isSelected ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.5)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isSelected ? '1.5px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.8)',
                borderRadius: 16,
                padding: '14px 10px',
                cursor: 'pointer',
                textAlign: 'center',
                fontFamily: 'var(--font-body)',
                boxShadow: isSelected ? '0 4px 20px rgba(99,102,241,0.15)' : '0 4px 16px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 6, lineHeight: 1 }}>{p.icon}</div>
              <div style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#1A1A2E',
                marginBottom: 3,
                transition: 'color 0.15s',
              }}>
                {p.title}
              </div>
              <div style={{
                fontSize: 11,
                color: '#64748B',
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
