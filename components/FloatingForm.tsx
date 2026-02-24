'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BarcodeScanner from './BarcodeScanner';
import FavoritenModal from './FavoritenModal';
import RezeptBuilder from './RezeptBuilder';
import type { FavoritItem } from './FavoritenModal';

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function FloatingForm({ onClose, onRefresh }: Props) {
  const [basisKcal, setBasisKcal] = useState('');
  const [basisEiweiss, setBasisEiweiss] = useState('');
  const [basisFett, setBasisFett] = useState('');
  const [basisKh, setBasisKh] = useState('');
  const [menge, setMenge] = useState('100');
  const [name, setName] = useState('');
  const [gptInput, setGptInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showFavoriten, setShowFavoriten] = useState(false);
  const [showRezeptBuilder, setShowRezeptBuilder] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<'g' | 'ml' | 'Stück' | 'Portion'>('g');
  const [unitWeight, setUnitWeight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Helper: advance to next input on Enter (mobile "Weiter" button)
  const handleNextField = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = formRef.current;
      if (!form) return;
      const inputs = Array.from(
        form.querySelectorAll<HTMLElement>('input:not([type="file"]), select')
      );
      const idx = inputs.indexOf(e.currentTarget as HTMLElement);
      if (idx >= 0 && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      } else {
        // Last field: blur to dismiss keyboard
        (e.currentTarget as HTMLElement).blur();
      }
    }
  };

  // Reset menge to sensible default when switching unit types
  const handleUnitChange = (newUnit: typeof selectedUnit) => {
    const wasWeight = selectedUnit === 'g' || selectedUnit === 'ml';
    const isWeight = newUnit === 'g' || newUnit === 'ml';
    setSelectedUnit(newUnit);
    if (wasWeight && !isWeight) {
      // g/ml → Stück/Portion: reset to 1
      setMenge('1');
    } else if (!wasWeight && isWeight) {
      // Stück/Portion → g/ml: reset to 100
      setMenge('100');
    }
  };

  const parseNum = (v: string) => parseFloat(v.replace(',', '.') || '0');
  const mengeVal = parseNum(menge) || 0;
  const unitWeightVal = parseNum(unitWeight) || 0;

  const getActualAmount = () => {
    if (selectedUnit === 'g' || selectedUnit === 'ml') return mengeVal;
    if (selectedUnit === 'Stück' || selectedUnit === 'Portion') return mengeVal * unitWeightVal;
    return mengeVal;
  };

  const actualAmount = getActualAmount();
  const calcKcal = () => ((parseNum(basisKcal) / 100) * actualAmount) || 0;
  const calcEiweiss = () => ((parseNum(basisEiweiss) / 100) * actualAmount) || 0;
  const calcFett = () => ((parseNum(basisFett) / 100) * actualAmount) || 0;
  const calcKh = () => ((parseNum(basisKh) / 100) * actualAmount) || 0;

  const handleGPT = async () => {
    if (!gptInput) return;
    setIsLoading(true);
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: gptInput }),
    });
    const data = await res.json();
    setIsLoading(false);
    if (res.ok) {
      setName(gptInput);
      setBasisKcal(String(data.Kalorien));
      setBasisEiweiss(String(data.Eiweiß));
      setBasisFett(String(data.Fett));
      setBasisKh(String(data.Kohlenhydrate));
      setMenge(data.menge ? String(data.menge) : '100');
      if (data.unit) setSelectedUnit(data.unit);
      if (data.unitWeight) setUnitWeight(String(data.unitWeight));
      setGptInput('');
    } else {
      alert('Fehler bei GPT');
    }
  };

  const handleBarcode = async (code: string) => {
    setScanning(false);
    setIsLoading(true);
    const res = await fetch(`/api/barcode?code=${code}&menge=1`);
    const data = await res.json();
    setIsLoading(false);
    if (res.ok) {
      setName(data.name);
      setBasisKcal(String(data.Kalorien));
      setBasisEiweiss(String(data.Eiweiß));
      setBasisFett(String(data.Fett));
      setBasisKh(String(data.Kohlenhydrate));
      setMenge(data.menge ? String(data.menge) : '100');
      if (data.unit) setSelectedUnit(data.unit);
      if (data.unitWeight) setUnitWeight(String(data.unitWeight));
    } else {
      alert('Produkt nicht gefunden');
    }
  };

  const handleFoto = async (base64: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/kalorien-bild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      setIsLoading(false);
      if (res.ok) {
        setName(data.name || 'Foto-Schätzung');
        setBasisKcal(String(data.kcal || data.Kalorien || ''));
        setBasisEiweiss(String(data.eiweiss || data.eiweiß || data.Eiweiß || ''));
        setBasisFett(String(data.fett || data.Fett || ''));
        setBasisKh(String(data.kh || data.Kohlenhydrate || ''));
        setMenge(data.menge ? String(data.menge) : '100');
      } else {
        alert(`Foto konnte nicht analysiert werden: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch {
      setIsLoading(false);
      alert('Netzwerk Fehler beim Foto-Upload');
    }
  };

  const handleFavorit = (item: FavoritItem, menge: number) => {
    setName(item.name);
    setBasisKcal(String(item.kcal));
    setBasisEiweiss(String(item.eiweiss));
    setBasisFett(String(item.fett));
    setBasisKh(String(item.kh));
    setMenge(String(menge));
    setSelectedUnit(item.unit);
    if (item.unitWeight) setUnitWeight(String(item.unitWeight));
  };

  const handleUseRecipe = (name: string, totalKcal: number, totalEiweiss: number, totalFett: number, totalKh: number, totalWeight: number) => {
    setName(name);
    const per100gKcal = totalWeight > 0 ? (totalKcal * 100) / totalWeight : 0;
    const per100gEiweiss = totalWeight > 0 ? (totalEiweiss * 100) / totalWeight : 0;
    const per100gFett = totalWeight > 0 ? (totalFett * 100) / totalWeight : 0;
    const per100gKh = totalWeight > 0 ? (totalKh * 100) / totalWeight : 0;
    setBasisKcal(String(per100gKcal.toFixed(1)));
    setBasisEiweiss(String(per100gEiweiss.toFixed(1)));
    setBasisFett(String(per100gFett.toFixed(1)));
    setBasisKh(String(per100gKh.toFixed(1)));
    setMenge(String(totalWeight));
    setSelectedUnit('g');
    setUnitWeight('');
  };

  const handleSpeichern = async () => {
    const now = new Date();
    const uhrzeit = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
    setIsLoading(true);
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        kcal: calcKcal(),
        eiweiss: calcEiweiss(),
        fett: calcFett(),
        kh: calcKh(),
        uhrzeit,
        unit: selectedUnit,
        unitWeight: unitWeightVal,
        menge: mengeVal,
      }),
    });
    setIsLoading(false);
    if (res.ok) {
      onRefresh?.();
      onClose();
    } else {
      alert('Fehler beim Speichern');
    }
  };

  return (
    <div style={overlayStyle}>
      <motion.div
        ref={formRef}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={formStyle}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Neuer Eintrag</h2>
            <p style={subtitleStyle}>Mahlzeit hinzufügen</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowRezeptBuilder(true)} style={iconButtonStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </button>
            <button onClick={onClose} style={closeButtonStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={loadingOverlayStyle}
            >
              <div style={{ width: 32, height: 32, border: '3px solid rgba(99, 102, 241, 0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* GPT Input */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Beschreibung (AI)</label>
          <textarea
            value={gptInput}
            onChange={e => setGptInput(e.target.value)}
            placeholder="z.B. 2 Eier und Toast mit Butter"
            rows={2}
            style={textareaStyle}
          />
          <button onClick={handleGPT} style={primaryButtonStyle} disabled={isLoading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            AI Schätzen
          </button>
        </div>

        {/* Favorites Button */}
        <button onClick={() => setShowFavoriten(true)} style={secondaryButtonStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Favoriten
        </button>

        {/* Product Name */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Produktname</label>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={handleNextField} enterKeyHint="next" style={inputStyle} placeholder="Name eingeben" />
        </div>

        {/* Unit Selection */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Einheit</label>
          <select value={selectedUnit} onChange={e => handleUnitChange(e.target.value as typeof selectedUnit)} onKeyDown={handleNextField} style={selectStyle}>
            <option value="g">Gramm (g)</option>
            <option value="ml">Milliliter (ml)</option>
            <option value="Stück">Stück</option>
            <option value="Portion">Portion</option>
          </select>
        </div>

        {/* Unit Weight for Stück/Portion */}
        {(selectedUnit === 'Stück' || selectedUnit === 'Portion') && (
          <div style={sectionStyle}>
            <label style={labelStyle}>Gewicht pro {selectedUnit} (g)</label>
            <input
              value={unitWeight}
              onChange={e => setUnitWeight(e.target.value)}
              onKeyDown={handleNextField}
              enterKeyHint="next"
              placeholder={selectedUnit === 'Stück' ? 'z.B. 180 für 1 Apfel' : 'z.B. 350 für 1 Portion'}
              inputMode="decimal"
              style={inputStyle}
            />
          </div>
        )}

        {/* Amount */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Menge ({selectedUnit})</label>
          <input value={menge} onChange={e => setMenge(e.target.value)} onKeyDown={handleNextField} enterKeyHint="next" inputMode="decimal" style={inputStyle} />
        </div>

        {/* Nutrition Grid */}
        <div style={sectionStyle}>
          <label style={labelStyle}>Nährwerte pro 100g</label>
          <div style={nutritionGridStyle}>
            {[
              { key: 'kcal', label: 'Kcal', value: basisKcal, setValue: setBasisKcal, calc: calcKcal, color: '#6366f1' },
              { key: 'fett', label: 'Fett', value: basisFett, setValue: setBasisFett, calc: calcFett, color: '#ec4899' },
              { key: 'kh', label: 'KH', value: basisKh, setValue: setBasisKh, calc: calcKh, color: '#f59e0b' },
              { key: 'eiweiss', label: 'Protein', value: basisEiweiss, setValue: setBasisEiweiss, calc: calcEiweiss, color: '#6366f1' },
            ].map((item, idx, arr) => (
              <div key={item.key} style={nutritionItemStyle}>
                <span style={{ ...nutritionLabelStyle, color: item.color }}>{item.label}</span>
                <input
                  value={item.value}
                  onChange={e => item.setValue(e.target.value)}
                  onKeyDown={handleNextField}
                  enterKeyHint={idx === arr.length - 1 ? 'done' : 'next'}
                  inputMode="decimal"
                  style={nutritionInputStyle}
                />
                <span style={nutritionCalcStyle}>{item.calc().toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setScanning(true)} style={scanButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Barcode
          </button>
          <label style={scanButtonStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith('image/')) { alert('Bitte Bilddatei wählen'); return; }
                if (file.size > 10 * 1024 * 1024) { alert('Bild zu groß (max 10MB)'); return; }
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result?.toString();
                  if (result) {
                    const base64 = result.split(',')[1];
                    if (base64) handleFoto(base64);
                  }
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>

        {/* Barcode Scanner */}
        {scanning && (
          <div style={{ marginBottom: 16 }}>
            <BarcodeScanner onDetected={handleBarcode} />
            <button onClick={() => setScanning(false)} style={{ ...scanButtonStyle, marginTop: 8, width: '100%' }}>Abbrechen</button>
          </div>
        )}

        {/* Save Button */}
        <button onClick={handleSpeichern} style={saveButtonStyle} disabled={isLoading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Eintragen
        </button>

        {/* Modals */}
        <FavoritenModal isOpen={showFavoriten} onClose={() => setShowFavoriten(false)} onSelect={handleFavorit} />
        <RezeptBuilder isOpen={showRezeptBuilder} onClose={() => setShowRezeptBuilder(false)} onUseRecipe={handleUseRecipe} />

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </motion.div>
    </div>
  );
}

// === STYLES ===
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1001,
};

const formStyle: React.CSSProperties = {
  background: 'linear-gradient(145deg, rgba(28, 28, 38, 0.98) 0%, rgba(22, 22, 29, 0.98) 100%)',
  color: '#fff', padding: 24,
  borderRadius: 24, width: '92%', maxWidth: 420,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  position: 'relative',
};

const headerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: 24, paddingBottom: 16,
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const titleStyle: React.CSSProperties = {
  margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0 0', fontSize: 13, color: '#71717a',
};

const closeButtonStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.06)', border: 'none',
  borderRadius: 10, width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#71717a', transition: 'all 150ms',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  border: 'none', borderRadius: 10, width: 36, height: 36,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#fff',
};

const loadingOverlayStyle: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15, 15, 20, 0.8)', borderRadius: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
};

const sectionStyle: React.CSSProperties = { marginBottom: 16 };

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: '#a1a1aa', marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(22, 22, 29, 0.8)', color: '#fff',
  transition: 'all 150ms',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'none', minHeight: 60,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6,9 12,15 18,9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
};

const primaryButtonStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 600,
  borderRadius: 12, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)', marginTop: 8,
};

const secondaryButtonStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
  borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.3)',
  background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  marginBottom: 16,
};

const nutritionGridStyle: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
};

const nutritionItemStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
  background: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, padding: 10,
};

const nutritionLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600 };

const nutritionInputStyle: React.CSSProperties = {
  width: '100%', padding: 6, fontSize: 13, borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(22, 22, 29, 0.8)', color: '#fff', textAlign: 'center',
};

const nutritionCalcStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#71717a',
};

const scanButtonStyle: React.CSSProperties = {
  flex: 1, padding: '10px 14px', fontSize: 13, fontWeight: 500,
  borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(255, 255, 255, 0.03)', color: '#a1a1aa',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
};

const saveButtonStyle: React.CSSProperties = {
  width: '100%', padding: '14px 20px', fontSize: 15, fontWeight: 600,
  borderRadius: 14, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
};
