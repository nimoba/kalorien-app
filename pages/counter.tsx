'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FloatingTabBar from '../components/FloatingTabBar';

export default function CounterPage() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCounter = async () => {
    try {
      const res = await fetch('/api/counter');
      if (res.ok) {
        const data = await res.json();
        setCount(data.count || 0);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Counters:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementCounter = async () => {
    setSaving(true);
    const newCount = count + 1;
    
    // Optimistisches Update
    setCount(newCount);
    
    try {
      const res = await fetch('/api/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: newCount }),
      });
      
      if (!res.ok) {
        // Bei Fehler zurücksetzen
        setCount(count);
        alert('❌ Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      setCount(count);
      alert('❌ Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const resetCounter = async () => {
    if (!confirm('🔄 Counter wirklich auf 0 zurücksetzen?')) return;
    
    setSaving(true);
    setCount(0);
    
    try {
      const res = await fetch('/api/counter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 0 }),
      });
      
      if (!res.ok) {
        setCount(count);
        alert('❌ Fehler beim Zurücksetzen');
      }
    } catch (error) {
      console.error('Fehler beim Zurücksetzen:', error);
      setCount(count);
      alert('❌ Fehler beim Zurücksetzen');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadCounter();
  }, []);

  if (loading) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>🔢 Counter</h1>
        <div style={counterDisplayStyle}>
          <div style={countStyle}>⏳</div>
          <div style={labelStyle}>Lädt...</div>
        </div>
        <FloatingTabBar />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🔢 Counter</h1>
      
      {/* Counter Display */}
      <motion.div 
        style={counterDisplayStyle}
        animate={{ scale: saving ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          style={countStyle}
          key={count}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {count}
        </motion.div>
        <div style={labelStyle}>
          {count === 1 ? 'Klick' : 'Klicks'}
        </div>
      </motion.div>

      {/* Buttons */}
      <div style={buttonContainerStyle}>
        <motion.button
          style={{
            ...incrementButtonStyle,
            opacity: saving ? 0.6 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
          onClick={incrementCounter}
          disabled={saving}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <span style={{ fontSize: 48, marginBottom: 8 }}>➕</span>
          <span style={{ fontSize: 18 }}>
            {saving ? 'Speichere...' : '+1'}
          </span>
        </motion.button>
        
        <motion.button
          style={resetButtonStyle}
          onClick={resetCounter}
          disabled={saving}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          <span style={{ fontSize: 24, marginBottom: 4 }}>🔄</span>
          <span style={{ fontSize: 14 }}>Reset</span>
        </motion.button>
      </div>

      {/* Info */}
      <div style={infoStyle}>
        <p>Drücke den ➕ Button um zu zählen!</p>
        <p style={{ fontSize: 12, color: '#666' }}>
          Der Counter wird automatisch gespeichert.
        </p>
      </div>

      <FloatingTabBar />
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  padding: '40px 24px',
  backgroundColor: '#2c2c2c',
  minHeight: '100vh',
  color: '#ffffff',
  fontFamily: 'sans-serif',
  paddingBottom: '100px',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  marginBottom: '40px',
  color: '#fff',
};

const counterDisplayStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 20,
  padding: 40,
  marginBottom: 40,
  border: '2px solid #444',
  minHeight: 200,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const countStyle: React.CSSProperties = {
  fontSize: '4rem',
  fontWeight: 'bold',
  color: '#4caf50',
  marginBottom: 8,
  fontFamily: 'monospace',
};

const labelStyle: React.CSSProperties = {
  fontSize: '1.2rem',
  color: '#ccc',
};

const buttonContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 20,
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: 40,
};

const incrementButtonStyle: React.CSSProperties = {
  backgroundColor: '#4caf50',
  color: '#fff',
  border: 'none',
  borderRadius: 20,
  padding: '30px 40px',
  fontSize: '1.2rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 120,
  minHeight: 120,
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
  transition: 'all 0.3s ease',
};

const resetButtonStyle: React.CSSProperties = {
  backgroundColor: '#ff5722',
  color: '#fff',
  border: 'none',
  borderRadius: 16,
  padding: '20px 30px',
  fontSize: '1rem',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minWidth: 80,
  minHeight: 80,
  justifyContent: 'center',
  boxShadow: '0 4px 15px rgba(255, 87, 34, 0.3)',
  transition: 'all 0.3s ease',
};

const infoStyle: React.CSSProperties = {
  textAlign: 'center',
  color: '#ccc',
  fontSize: '1rem',
  lineHeight: '1.6',
};