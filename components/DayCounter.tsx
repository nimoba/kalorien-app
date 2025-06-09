'use client';

import { useState, useEffect } from 'react';

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
      <div style={containerStyle}>
        <div style={iconStyle}>📊</div>
        <div style={countStyle}>⏳</div>
        <div style={labelStyle}>Lade...</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>🔥</div>
      <div style={countStyle}>{totalDays}</div>
      <div style={labelStyle}>
        {totalDays === 1 ? 'Tag aktiv' : 'Tage aktiv'}
      </div>
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 16,
  padding: 20,
  marginTop: 20,
  border: '1px solid #444',
  textAlign: 'center',
  minHeight: 120,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const iconStyle: React.CSSProperties = {
  fontSize: 32,
  marginBottom: 8,
};

const countStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 'bold',
  color: '#4caf50',
  marginBottom: 4,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#ccc',
};