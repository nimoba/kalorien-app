'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import BarcodeScanner from './BarcodeScanner';
import FavoritenModal from './FavoritenModal';
import RezeptBuilder from './RezeptBuilder';
import type { FavoritItem } from './FavoritenModal';

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function FloatingForm({ onClose, onRefresh }: Props) {
  // === Basis pro 100g ===
  const [basisKcal, setBasisKcal] = useState('');      // z.B. "250"
  const [basisEiweiss, setBasisEiweiss] = useState(''); // z.B. "10"
  const [basisFett, setBasisFett] = useState('');       // z.B. "5"
  const [basisKh, setBasisKh] = useState('');           // z.B. "30"

  // === Menge und Produkt ===
  const [menge, setMenge] = useState('100');
  const [name, setName] = useState('');
  const [gptInput, setGptInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showFavoriten, setShowFavoriten] = useState(false);
  const [showRezeptBuilder, setShowRezeptBuilder] = useState(false);
  
  // === Einheiten-System ===
  const [selectedUnit, setSelectedUnit] = useState<'g' | 'ml' | 'Stück' | 'Portion'>('g');
  const [unitWeight, setUnitWeight] = useState(''); // Gewicht pro Einheit für Stück/Portion

  const parseNum = (v: string) => parseFloat(v.replace(',', '.') || '0');
  const mengeVal = parseNum(menge) || 0;
  const unitWeightVal = parseNum(unitWeight) || 0;

  // Berechnete Werte basierend auf Einheit
  const getActualAmount = () => {
    if (selectedUnit === 'g' || selectedUnit === 'ml') {
      return mengeVal;
    } else if (selectedUnit === 'Stück' || selectedUnit === 'Portion') {
      return mengeVal * unitWeightVal;
    }
    return mengeVal;
  };

  const actualAmount = getActualAmount();
  
  // Berechnete Werte (Basis-Werte sind immer pro 100g/100ml)
  const calcKcal    = () => ((parseNum(basisKcal)    / 100) * actualAmount) || 0;
  const calcEiweiss = () => ((parseNum(basisEiweiss) / 100) * actualAmount) || 0;
  const calcFett    = () => ((parseNum(basisFett)    / 100) * actualAmount) || 0;
  const calcKh      = () => ((parseNum(basisKh)      / 100) * actualAmount) || 0;

  // === API-Handler (GPT, Barcode, Foto, Favoriten, Speichern) ===

  const handleGPT = async () => {
    if (!gptInput) return;
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: gptInput }),
    });
    const data = await res.json();
    if (res.ok) {
      setName(gptInput);
      setBasisKcal(String(data.Kalorien));
      setBasisEiweiss(String(data.Eiweiß));
      setBasisFett(String(data.Fett));
      setBasisKh(String(data.Kohlenhydrate));
      setMenge(data.menge ? String(data.menge) : '100');
      
      // Einheit von GPT setzen, falls vorhanden
      if (data.unit) {
        setSelectedUnit(data.unit);
      }
      if (data.unitWeight) {
        setUnitWeight(String(data.unitWeight));
      }
      
      setGptInput('');
    } else {
      alert('❌ Fehler bei GPT');
    }
  };

  const handleBarcode = async (code: string) => {
    setScanning(false);
    const res = await fetch(`/api/barcode?code=${code}&menge=1`);
    const data = await res.json();
    if (res.ok) {
      setName(data.name);
      setBasisKcal(String(data.Kalorien));
      setBasisEiweiss(String(data.Eiweiß));
      setBasisFett(String(data.Fett));
      setBasisKh(String(data.Kohlenhydrate));
      setMenge(data.menge ? String(data.menge) : '100');
      
      // Einheit von Barcode setzen, falls vorhanden
      if (data.unit) {
        setSelectedUnit(data.unit);
      }
      if (data.unitWeight) {
        setUnitWeight(String(data.unitWeight));
      }
    } else {
      alert('❌ Produkt nicht gefunden');
    }
  };

  const handleFoto = async (base64: string) => {
    try {
      console.log('📸 Sende Foto an API, Größe:', base64.length);
      const res = await fetch('/api/kalorien-bild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      console.log('📸 API Antwort:', data);
      
      if (res.ok) {
        setName(data.name || 'Foto-Schätzung');
        setBasisKcal(String(data.kcal || data.Kalorien || ''));
        setBasisEiweiss(String(data.eiweiss || data.eiweiß || data.Eiweiß || ''));
        setBasisFett(String(data.fett || data.Fett || ''));
        setBasisKh(String(data.kh || data.Kohlenhydrate || ''));
        setMenge(data.menge ? String(data.menge) : '100');
      } else {
        console.error('❌ Foto API Fehler:', data);
        alert(`❌ Foto konnte nicht analysiert werden: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error('❌ Netzwerk Fehler:', error);
      alert('❌ Netzwerk Fehler beim Foto-Upload');
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
    if (item.unitWeight) {
      setUnitWeight(String(item.unitWeight));
    }
  };

  const handleUseRecipe = (name: string, totalKcal: number, totalEiweiss: number, totalFett: number, totalKh: number, totalWeight: number) => {
    setName(name);
    // Calculate per-100g values based on total weight
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
    const uhrzeit = now.toLocaleTimeString('de-DE', {
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        kcal:    calcKcal(),
        eiweiss: calcEiweiss(),
        fett:    calcFett(),
        kh:      calcKh(),
        uhrzeit,
        unit: selectedUnit,
        unitWeight: unitWeightVal,
        menge: mengeVal,
      }),
    });
    if (res.ok) {
      onRefresh?.();
      onClose();
    } else {
      alert('❌ Fehler beim Speichern');
    }
  };

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={formStyle}
      >
        <button onClick={onClose} style={closeStyle}>✕</button>
        <button onClick={() => setShowRezeptBuilder(true)} style={recipeButtonStyle}>📖</button>
        <h2 style={{ marginBottom: 12 }}>➕ Neuer Eintrag</h2>

        {/* GPT Beschreibung */}
        <label>GPT Beschreibung:</label>
        <textarea
          value={gptInput}
          onChange={e => setGptInput(e.target.value)}
          placeholder="z. B. 2 Eier und Toast"
          rows={2}
          style={inputStyle}
        />
        <button onClick={handleGPT} style={buttonStyle}>💡 GPT Schätzen</button>

        {/* Favoriten Button */}
        <button 
          onClick={() => setShowFavoriten(true)} 
          style={{ ...buttonStyle, backgroundColor: '#f39c12', marginBottom: 16 }}
        >
          ⭐ Favoriten durchsuchen
        </button>

        {/* Produkt & Menge */}
        <label>Produktname:</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={inputStyle}
        />

        {/* Einheiten-Auswahl */}
        <label>Einheit:</label>
        <select
          value={selectedUnit}
          onChange={e => setSelectedUnit(e.target.value as 'g' | 'ml' | 'Stück' | 'Portion')}
          style={inputStyle}
        >
          <option value="g">Gramm (g)</option>
          <option value="ml">Milliliter (ml)</option>
          <option value="Stück">Stück</option>
          <option value="Portion">Portion</option>
        </select>

        {/* Gewicht pro Einheit für Stück/Portion */}
        {(selectedUnit === 'Stück' || selectedUnit === 'Portion') && (
          <>
            <label>Gewicht pro {selectedUnit} (in g):</label>
            <input
              value={unitWeight}
              onChange={e => setUnitWeight(e.target.value)}
              placeholder={selectedUnit === 'Stück' ? 'z.B. 180 für 1 Apfel' : 'z.B. 350 für 1 Portion'}
              inputMode="decimal"
              pattern="[0-9.,]*"
              style={inputStyle}
            />
          </>
        )}

        <label>Menge ({selectedUnit}):</label>
        <input
          value={menge}
          onChange={e => setMenge(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.,]*"
          style={inputStyle}
        />

        {/* Basiswerte pro 100g + Berechnung */}
        <label>Kalorien (pro 100 g):</label>
        <div style={rowStyle}>
          <input
            value={basisKcal}
            onChange={e => setBasisKcal(e.target.value)}
            onBlur={() => setBasisKcal(parseNum(basisKcal).toFixed(1))}
            inputMode="decimal"
            pattern="[0-9.,]*"
            style={inputStyle}
          />
          <span style={calcStyle}>{calcKcal().toFixed(1)} kcal</span>
        </div>

        <div style={rowStyle}>
          <div style={macroGroup}>
            <label style={macroLabel}>KH/100g:</label>
            <input
              value={basisKh}
              onChange={e => setBasisKh(e.target.value)}
              onBlur={() => setBasisKh(parseNum(basisKh).toFixed(1))}
              inputMode="decimal"
              pattern="[0-9.,]*"
              style={macroInput}
            />
            <span style={calcMacroStyle}>{calcKh().toFixed(1)}</span>
          </div>
          <div style={macroGroup}>
            <label style={macroLabel}>F/100g:</label>
            <input
              value={basisFett}
              onChange={e => setBasisFett(e.target.value)}
              onBlur={() => setBasisFett(parseNum(basisFett).toFixed(1))}
              inputMode="decimal"
              pattern="[0-9.,]*"
              style={macroInput}
            />
            <span style={calcMacroStyle}>{calcFett().toFixed(1)}</span>
          </div>
          <div style={macroGroup}>
            <label style={macroLabel}>P/100g:</label>
            <input
              value={basisEiweiss}
              onChange={e => setBasisEiweiss(e.target.value)}
              onBlur={() => setBasisEiweiss(parseNum(basisEiweiss).toFixed(1))}
              inputMode="decimal"
              pattern="[0-9.,]*"
              style={macroInput}
            />
            <span style={calcMacroStyle}>{calcEiweiss().toFixed(1)}</span>
          </div>
        </div>

        {/* Foto & Barcode */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16 }}>
          <button onClick={() => setScanning(true)} style={{ ...fotoButtonStyle, flex: 1 }}>
            📷 Barcode
          </button>
          <label style={{ ...fotoButtonStyle, flex: 1 }}>
            📸 Foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                
                // Check file type
                if (!file.type.startsWith('image/')) {
                  alert('❌ Bitte wählen Sie eine Bilddatei aus');
                  return;
                }
                
                // Check file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                  alert('❌ Bild ist zu groß (max 10MB)');
                  return;
                }
                
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result?.toString();
                  if (result) {
                    const base64 = result.split(',')[1];
                    if (base64) {
                      console.log('📸 Bild geladen, Größe:', base64.length);
                      handleFoto(base64);
                    } else {
                      alert('❌ Fehler beim Lesen der Bilddatei');
                    }
                  }
                };
                reader.onerror = () => {
                  alert('❌ Fehler beim Lesen der Bilddatei');
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>
        
        {scanning && (
          <div style={{ marginBottom: 12 }}>
            <BarcodeScanner onDetected={handleBarcode} />
            <button onClick={() => setScanning(false)} style={{ marginTop: 8 }}>❌ Abbrechen</button>
          </div>
        )}

        <button onClick={handleSpeichern} style={{ ...buttonStyle, backgroundColor: '#3cb043' }}>
          ✅ Eintragen
        </button>

        {/* Favoriten Modal */}
        <FavoritenModal
          isOpen={showFavoriten}
          onClose={() => setShowFavoriten(false)}
          onSelect={handleFavorit}
        />

        {/* Rezept Builder */}
        <RezeptBuilder
          isOpen={showRezeptBuilder}
          onClose={() => setShowRezeptBuilder(false)}
          onUseRecipe={handleUseRecipe}
        />
      </motion.div>
    </div>
  );
}

// === STYLES ===
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 999,
};
const formStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a', color: '#fff', padding: 16,
  borderRadius: 16, width: '90%', maxWidth: 400,
  maxHeight: '90vh', overflowY: 'auto',
  boxShadow: '0 5px 20px rgba(0,0,0,0.3)',
  position: 'relative',
};
const closeStyle: React.CSSProperties = {
  position: 'absolute', top: 12, right: 12,
  background: 'transparent', color: '#fff',
  fontSize: 20, border: 'none', cursor: 'pointer',
};
const recipeButtonStyle: React.CSSProperties = {
  position: 'absolute', top: 12, right: 48,
  background: '#f39c12', color: '#fff',
  fontSize: 16, border: 'none', cursor: 'pointer',
  borderRadius: 6, padding: '4px 8px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: 8, fontSize: 14,
  marginBottom: 6, borderRadius: 8,
  border: '1px solid #555', backgroundColor: '#1e1e1e',
  color: '#fff',
};
const buttonStyle: React.CSSProperties = {
  backgroundColor: '#36a2eb', color: '#fff', border: 'none',
  borderRadius: 8, padding: '8px 10px', fontSize: 14,
  cursor: 'pointer', width: '100%', marginBottom: 10,
};
const fotoButtonStyle: React.CSSProperties = {
  backgroundColor: '#444', border: '1px solid #666',
  borderRadius: 8, fontSize: 14, height: 40,
  padding: '0 10px', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
};
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  gap: 4,   // kleiner Abstand zwischen Input und Berechnung
  marginBottom: 6,
};
const calcStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#ccc',
  minWidth: 60,
  textAlign: 'right',
};
const macroGroup: React.CSSProperties = {
  display: 'flex', alignItems: 'center',
  gap: 4,   // kleiner Abstand zwischen Macro-Input und Berechnung
};
const macroLabel: React.CSSProperties = {
  fontSize: 12, color: '#aaa',
};
const macroInput: React.CSSProperties = {
  width: 40, padding: 4, fontSize: 12,
  borderRadius: 6, border: '1px solid #555',
  backgroundColor: '#1e1e1e', color: '#fff',
};
const calcMacroStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#ccc',
  width: 32,
  textAlign: 'right',
};