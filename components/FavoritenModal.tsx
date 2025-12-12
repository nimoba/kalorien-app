'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FavoritItem {
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  unit: 'g' | 'ml' | 'Stück' | 'Portion';
  unitWeight?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: FavoritItem, menge: number) => void;
}

export default function FavoritenModal({ isOpen, onClose, onSelect }: Props) {
  const [favoriten, setFavoriten] = useState<FavoritItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMenge, setSelectedMenge] = useState<Record<string, number>>({});

  const loadFavoriten = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favoriten');
      const data = await res.json();
      if (res.ok) {
        setFavoriten(data);
        const defaultMengen = data.reduce((acc: Record<string, number>, item: FavoritItem) => {
          acc[item.name] = item.unit === 'Stück' || item.unit === 'Portion' ? 1 : 100;
          return acc;
        }, {});
        setSelectedMenge(defaultMengen);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && favoriten.length === 0) {
      loadFavoriten();
    }
  }, [isOpen, favoriten.length, loadFavoriten]);

  const filteredFavoriten = useMemo(() => {
    if (!searchTerm.trim()) return favoriten;
    const term = searchTerm.toLowerCase();
    return favoriten.filter(item => item.name.toLowerCase().includes(term));
  }, [favoriten, searchTerm]);

  const getDisplayUnit = (item: FavoritItem) => {
    if (item.unit === 'g' || item.unit === 'ml') {
      return `100${item.unit}`;
    } else if (item.unit === 'Stück' || item.unit === 'Portion') {
      return `1 ${item.unit}${item.unitWeight ? ` (${item.unitWeight}g)` : ''}`;
    }
    return '100g';
  };

  const handleSelect = (item: FavoritItem) => {
    const menge = selectedMenge[item.name] || getDefaultMenge(item);
    onSelect(item, menge);
    onClose();
  };

  const getDefaultMenge = (item: FavoritItem) => {
    return item.unit === 'Stück' || item.unit === 'Portion' ? 1 : 100;
  };

  const updateMenge = (itemName: string, menge: number) => {
    setSelectedMenge(prev => ({ ...prev, [itemName]: menge }));
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
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={modalStyle}
        >
          {/* Header */}
          <div style={headerStyle}>
            <div style={headerIconStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <h2 style={titleStyle}>Favoriten</h2>
              <p style={subtitleStyle}>{favoriten.length} gespeicherte Einträge</p>
            </div>
            <button onClick={onClose} style={closeButtonStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div style={searchContainerStyle}>
            <div style={searchInputWrapperStyle}>
              <svg style={searchIconStyle} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Favoriten durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
                autoFocus
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={clearSearchStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={contentStyle}>
            {loading ? (
              <div style={loadingContainerStyle}>
                <div style={spinnerStyle} />
                <span style={{ color: '#71717a', fontSize: 14 }}>Lade Favoriten...</span>
              </div>
            ) : filteredFavoriten.length === 0 ? (
              <div style={emptyStyle}>
                <div style={emptyIconStyle}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <p style={{ color: '#71717a', margin: 0 }}>
                  {searchTerm ? 'Keine Treffer gefunden' : 'Noch keine Favoriten vorhanden'}
                </p>
              </div>
            ) : (
              <div style={listStyle}>
                {filteredFavoriten.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    style={itemStyle}
                  >
                    <div style={itemInfoStyle}>
                      <div style={itemNameStyle}>{item.name}</div>
                      <div style={nutritionRowStyle}>
                        <span style={{ ...nutritionTagStyle, color: '#f97316' }}>{item.kcal} kcal</span>
                        <span style={{ ...nutritionTagStyle, color: '#ef4444' }}>{item.eiweiss}g P</span>
                        <span style={{ ...nutritionTagStyle, color: '#eab308' }}>{item.fett}g F</span>
                        <span style={{ ...nutritionTagStyle, color: '#6366f1' }}>{item.kh}g KH</span>
                      </div>
                      <div style={unitInfoStyle}>pro {getDisplayUnit(item)}</div>
                    </div>

                    <div style={mengeContainerStyle}>
                      <input
                        type="number"
                        value={selectedMenge[item.name] || getDefaultMenge(item)}
                        onChange={(e) => updateMenge(item.name, Number(e.target.value))}
                        style={mengeInputStyle}
                        min="1"
                        step="1"
                      />
                      <span style={mengeUnitStyle}>{item.unit}</span>
                    </div>

                    <motion.button
                      onClick={() => handleSelect(item)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={addButtonStyle}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && favoriten.length > 0 && (
            <div style={footerStyle}>
              <span style={{ color: '#52525b', fontSize: 12 }}>
                {filteredFavoriten.length} von {favoriten.length} Favoriten
              </span>
            </div>
          )}
        </motion.div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: '#1c1c26',
  borderRadius: 24,
  width: '100%',
  maxWidth: 500,
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '20px 20px 16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const headerIconStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: 'rgba(251, 191, 36, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: '#fff',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  margin: '2px 0 0 0',
  fontSize: 13,
  color: '#71717a',
};

const closeButtonStyle: React.CSSProperties = {
  marginLeft: 'auto',
  width: 36,
  height: 36,
  borderRadius: 10,
  border: 'none',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#71717a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const searchContainerStyle: React.CSSProperties = {
  padding: '16px 20px',
};

const searchInputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: 14,
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 40px 12px 44px',
  fontSize: 15,
  borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  outline: 'none',
};

const clearSearchStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  width: 24,
  height: 24,
  borderRadius: 6,
  border: 'none',
  background: 'rgba(255, 255, 255, 0.1)',
  color: '#71717a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  gap: 16,
};

const spinnerStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  border: '3px solid rgba(251, 191, 36, 0.2)',
  borderTopColor: '#fbbf24',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
  gap: 16,
  textAlign: 'center',
};

const emptyIconStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.03)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 12px 12px 12px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: 14,
  marginBottom: 8,
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.06)',
  gap: 12,
};

const itemInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemNameStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: 15,
  fontWeight: 500,
  marginBottom: 6,
  textTransform: 'capitalize',
};

const nutritionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 4,
};

const nutritionTagStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
};

const unitInfoStyle: React.CSSProperties = {
  color: '#52525b',
  fontSize: 11,
};

const mengeContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const mengeInputStyle: React.CSSProperties = {
  width: 56,
  padding: '8px 6px',
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  textAlign: 'center',
  outline: 'none',
};

const mengeUnitStyle: React.CSSProperties = {
  color: '#71717a',
  fontSize: 12,
  minWidth: 28,
};

const addButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const footerStyle: React.CSSProperties = {
  padding: '14px 20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
  textAlign: 'center',
};
