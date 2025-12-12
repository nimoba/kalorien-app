'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Props {
  refresh?: number;
}

export default function DayCounter({ refresh }: Props) {
  const [totalDays, setTotalDays] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadDayCount = async () => {
    try {
      const res = await fetch('/api/day-count');
      if (res.ok) {
        const data = await res.json();
        setTotalDays(data.totalDays || 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Tage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDayCount();
  }, [refresh]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={containerStyle}
      >
        <div style={{
          width: 60,
          height: 60,
          borderRadius: 16,
          background: 'rgba(255, 255, 255, 0.06)',
        }} className="skeleton" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={containerStyle}
    >
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 120,
        height: 120,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Fire icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          position: 'relative',
          border: '1px solid rgba(249, 115, 22, 0.3)',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.5))',
          }}
        >
          <path
            d="M12 23c4.97 0 9-4.03 9-9-1.39-1.39-2.78-2.78-4.17-4.17C15.89 8.39 15.45 7.41 15 6c-.45 1.41-.89 2.39-1.83 3.83-1.39-1.39-2.78-2.78-4.17-4.17-.56.42-.56.42-1 1 .89.89 1.78 1.78 2.67 2.67C9.72 10.28 9.28 10.72 8.33 11.67 8.33 11.67 8.33 11.67 8 12c-1.33.67-2.67 1.33-4 2-.67.67-1 1-1 2 0 4.97 4.03 9 9 9z"
            fill="url(#fireGradient)"
          />
          <defs>
            <linearGradient id="fireGradient" x1="3" y1="23" x2="21" y2="6" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f97316" />
              <stop offset="1" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Counter */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        style={{
          fontSize: 42,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 4,
        }}
      >
        {totalDays}
      </motion.div>

      {/* Label */}
      <div style={{
        fontSize: 13,
        color: '#71717a',
        fontWeight: 500,
      }}>
        {totalDays === 1 ? 'Tag aktiv' : 'Tage aktiv'}
      </div>
    </motion.div>
  );
}

const containerStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 20,
  padding: 24,
  marginTop: 20,
  border: '1px solid rgba(255, 255, 255, 0.06)',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
};
