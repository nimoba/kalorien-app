'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FavoritItem {
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
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
        // Standardmenge 100g für alle Items setzen
        const defaultMengen = data.reduce((acc: Record<string, number>, item: FavoritItem) => {
          acc[item.name] = 100;
          return acc;
        }, {});
        setSelectedMenge(defaultMengen);
      } else {
        console.error('Fehler beim Laden der Favoriten:', data.error);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Favoriten:', error);
    }
    setLoading(false);
  }, []);

  // Favoriten laden beim Öffnen
  useEffect(() => {
    if (isOpen && favoriten.length === 0) {
      loadFavoriten();
    }
  }, [isOpen, favoriten.length, loadFavoriten]);

  // Live-Filterung basierend auf Suchbegriff
  const filteredFavoriten = useMemo(() => {
    if (!searchTerm.trim()) return favoriten;
    
    const term = searchTerm.toLowerCase();
    return favoriten.filter(item => 
      item.name.toLowerCase().includes(term)
    );
  }, [favoriten, searchTerm]);

  const handleSelect = (item: FavoritItem) => {
    const menge = selectedMenge[item.name] || 100;
    onSelect(item, menge);
    onClose();
  };

  const updateMenge = (itemName: string, menge: number) => {
    setSelectedMenge(prev => ({
      ...prev,
      [itemName]: menge
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        style={modalStyle}
      >
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: 20 }}>⭐ Favoriten</h2>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {/* Suchfeld */}
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 Favoriten durchsuchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
            autoFocus
          />
        </div>

        {/* Content */}
        <div style={contentStyle}>
          {loading ? (
            <div style={loadingStyle}>⏳ Lade Favoriten...</div>
          ) : filteredFavoriten.length === 0 ? (
            <div style={emptyStyle}>
              {searchTerm ? '🔍 Keine Treffer gefunden' : '📝 Noch keine Favoriten vorhanden'}
            </div>
          ) : (
            <div style={listStyle}>
                {filteredFavoriten.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    style={itemStyle}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Item Info */}
                    <div style={itemInfoStyle}>
                      <div style={itemNameStyle}>{item.name}</div>
                      <div style={itemNutritionStyle}>
                        {item.kcal} kcal • {item.eiweiss}g P • {item.fett}g F • {item.kh}g KH
                      </div>
                    </div>

                    {/* Menge Input */}
                    <div style={mengeContainerStyle}>
                      <input
                        type="number"
                        value={selectedMenge[item.name] || 100}
                        onChange={(e) => updateMenge(item.name, Number(e.target.value))}
                        style={mengeInputStyle}
                        min="1"
                        step="1"
                      />
                      <span style={mengeUnitStyle}>g</span>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleSelect(item)}
                      style={addButtonStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2980b9';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#36a2eb';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ➕
                    </button>
                  </motion.div>
                ))}
            </div>
          )}
        </div>

        {/* Footer mit Infos */}
        {!loading && favoriten.length > 0 && (
          <div style={footerStyle}>
            {filteredFavoriten.length} von {favoriten.length} Favoriten
          </div>
        )}
      </motion.div>
    </div>
  );
}

// === STYLES ===
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 16,
  width: '95%',
  maxWidth: 500,
  maxHeight: '85vh',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 20px 16px 20px',
  borderBottom: '1px solid #444',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#fff',
  fontSize: 24,
  cursor: 'pointer',
  padding: 4,
  borderRadius: 4,
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: 16,
  borderRadius: 12,
  border: '2px solid #444',
  backgroundColor: '#1e1e1e',
  color: '#fff',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const loadingStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#ccc',
  fontSize: 16,
};

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  color: '#888',
  fontSize: 16,
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px 0',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 20px',
  borderBottom: '1px solid #333',
  gap: 12,
  transition: 'background-color 0.2s',
  cursor: 'pointer',
};

const itemInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const itemNameStyle: React.CSSProperties = {
  color: '#fff',
  fontSize: 16,
  fontWeight: '500',
  marginBottom: 4,
  textTransform: 'capitalize',
};

const itemNutritionStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: 12,
  lineHeight: 1.2,
};

const mengeContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const mengeInputStyle: React.CSSProperties = {
  width: 60,
  padding: 6,
  fontSize: 14,
  borderRadius: 6,
  border: '1px solid #555',
  backgroundColor: '#1e1e1e',
  color: '#fff',
  textAlign: 'center',
};

const mengeUnitStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: 12,
};

const addButtonStyle: React.CSSProperties = {
  backgroundColor: '#36a2eb',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 16,
  width: 36,
  height: 36,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const footerStyle: React.CSSProperties = {
  padding: '12px 20px',
  borderTop: '1px solid #444',
  color: '#888',
  fontSize: 12,
  textAlign: 'center',
};