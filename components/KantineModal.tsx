'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface KantineDish {
  id: number;
  category: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  gewicht: number;
  preis: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (dish: KantineDish) => void;
}

export default function KantineModal({ isOpen, onClose, onSelect }: Props) {
  const [dishes, setDishes] = useState<KantineDish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/kantine');
      const data = await res.json();
      if (res.ok) {
        setDishes(data.dishes || []);
      } else {
        setError(data.error || 'Speiseplan konnte nicht geladen werden');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Netzwerkfehler');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) loadMenu();
  }, [isOpen, loadMenu]);

  const handleSelect = (dish: KantineDish) => {
    onSelect(dish);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={overlayStyle}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={modalStyle}
        >
          <div style={headerStyle}>
            <div style={headerIconStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11h18" />
                <path d="M12 3v8" />
                <path d="M6 11v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9" />
              </svg>
            </div>
            <div>
              <h2 style={titleStyle}>Kantine heute</h2>
              <p style={subtitleStyle}>PwC Frankfurt Tower</p>
            </div>
            <button onClick={onClose} style={closeButtonStyle} aria-label="Schließen">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={contentStyle}>
            {loading ? (
              <div style={loadingContainerStyle}>
                <div style={spinnerStyle} />
                <span style={{ color: '#71717a', fontSize: 14 }}>Lade Speiseplan...</span>
              </div>
            ) : error ? (
              <div style={emptyStyle}>
                <p style={{ color: '#ef4444', margin: 0, fontSize: 14 }}>{error}</p>
                <button onClick={loadMenu} style={retryButtonStyle}>Erneut versuchen</button>
              </div>
            ) : dishes.length === 0 ? (
              <div style={emptyStyle}>
                <p style={{ color: '#71717a', margin: 0 }}>Heute kein Speiseplan verfügbar</p>
              </div>
            ) : (
              <div style={listStyle}>
                {dishes.map((dish) => (
                  <div key={dish.id || dish.name} style={itemStyle}>
                    <div style={itemInfoStyle}>
                      {dish.category && <div style={categoryStyle}>{dish.category}</div>}
                      <div style={itemNameStyle}>{dish.name}</div>
                      <div style={metaRowStyle}>
                        {dish.kcal > 0 && <span style={{ ...metaTagStyle, color: '#f97316' }}>{Math.round((dish.kcal * dish.gewicht) / 100)} kcal</span>}
                        {dish.gewicht > 0 && <span style={{ ...metaTagStyle, color: '#71717a' }}>{dish.gewicht} g</span>}
                        {dish.preis > 0 && <span style={{ ...metaTagStyle, color: '#10b981' }}>{dish.preis.toFixed(2).replace('.', ',')} €</span>}
                      </div>
                    </div>
                    <button onClick={() => handleSelect(dish)} style={addButtonStyle} aria-label="Übernehmen">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1002, padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: '#1c1c26', borderRadius: 24,
  width: '100%', maxWidth: 500, maxHeight: '85vh',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '20px 20px 16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const headerIconStyle: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 14,
  background: 'rgba(249, 115, 22, 0.15)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  margin: '2px 0 0 0', fontSize: 13, color: '#71717a',
};

const closeButtonStyle: React.CSSProperties = {
  marginLeft: 'auto', width: 36, height: 36, borderRadius: 10,
  border: 'none', background: 'rgba(255, 255, 255, 0.05)',
  color: '#71717a', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const contentStyle: React.CSSProperties = {
  flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 40, gap: 16,
};

const spinnerStyle: React.CSSProperties = {
  width: 32, height: 32,
  border: '3px solid rgba(249, 115, 22, 0.2)',
  borderTopColor: '#f97316',
  borderRadius: '50%', animation: 'spin 1s linear infinite',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 40, gap: 16, textAlign: 'center',
};

const retryButtonStyle: React.CSSProperties = {
  padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 10,
  border: '1px solid rgba(249, 115, 22, 0.3)',
  background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', cursor: 'pointer',
};

const listStyle: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '12px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: 14, marginBottom: 8,
  background: 'rgba(255, 255, 255, 0.03)', borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.06)', gap: 12,
};

const itemInfoStyle: React.CSSProperties = {
  flex: 1, minWidth: 0,
};

const categoryStyle: React.CSSProperties = {
  color: '#f97316', fontSize: 11, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4,
};

const itemNameStyle: React.CSSProperties = {
  color: '#fff', fontSize: 14, fontWeight: 500, marginBottom: 6, lineHeight: 1.3,
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex', gap: 10, flexWrap: 'wrap',
};

const metaTagStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600,
};

const addButtonStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
