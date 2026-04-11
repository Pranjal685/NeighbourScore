import React from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

export function getScoreColor(score) {
  if (score === null || score === undefined) return '#484F58';
  if (score >= 80) return '#3FB950';
  if (score >= 60) return '#E6A817';
  return '#F85149';
}

export function getScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  return 'Needs Attention';
}

function ScoreGauge({ score }) {
  const displayScore = Math.max(score || 0, 20);
  const animatedScore = useCountUp(displayScore, 1500);
  const color = getScoreColor(displayScore);

  const size = 210;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 82;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (animatedScore / 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="gaugeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="bgCircle" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.03" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Subtle background fill */}
        <circle cx={cx} cy={cy} r={radius + 20} fill="url(#bgCircle)" />

        {/* Track ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgba(240,246,252,0.05)"
          strokeWidth={strokeWidth}
        />

        {/* Progress ring */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          filter="url(#gaugeGlow)"
          style={{ transition: 'stroke-dasharray 0.05s linear, stroke 0.3s' }}
        />

        {/* Score number */}
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          style={{
            fontSize: 56,
            fontWeight: 800,
            fontFamily: 'Space Grotesk, sans-serif',
            transition: 'fill 0.3s'
          }}
        >
          {animatedScore}
        </text>

        {/* /100 label */}
        <text
          x={cx} y={cy + 36}
          textAnchor="middle"
          fill="#484F58"
          style={{
            fontSize: 12,
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          out of 100
        </text>
      </svg>
    </motion.div>
  );
}

export default ScoreGauge;
