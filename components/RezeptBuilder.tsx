'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import BarcodeScanner from './BarcodeScanner';
import FavoritenModal from './FavoritenModal';
import type { FavoritItem } from './FavoritenModal';

interface Ingredient {
  id: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  menge: number;
  unit: 'g' | 'ml' | 'Stück' | 'Portion';
  unitWeight?: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUseRecipe: (name: string, totalKcal: number, totalEiweiss: number, totalFett: number, totalKh: number) => void;
}

export default function RezeptBuilder({ isOpen, onClose, onUseRecipe }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [rezeptName, setRezeptName] = useState('');
  
  // Form states for adding new ingredient
  const [basisKcal, setBasisKcal] = useState('');
  const [basisEiweiss, setBasisEiweiss] = useState('');
  const [basisFett, setBasisFett] = useState('');
  const [basisKh, setBasisKh] = useState('');
  const [menge, setMenge] = useState('100');
  const [name, setName] = useState('');
  const [gptInput, setGptInput] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'g' | 'ml' | 'Stück' | 'Portion'>('g');
  const [unitWeight, setUnitWeight] = useState('');
  const [scanning, setScanning] = useState(false);
  const [showFavoriten, setShowFavoriten] = useState(false);

  const parseNum = (v: string) => parseFloat(v.replace(',', '.') || '0');
  const mengeVal = parseNum(menge) || 0;
  const unitWeightVal = parseNum(unitWeight) || 0;

  const getActualAmount = () => {
    if (selectedUnit === 'g' || selectedUnit === 'ml') {
      return mengeVal;
    } else if (selectedUnit === 'Stück' || selectedUnit === 'Portion') {
      return mengeVal * unitWeightVal;
    }
    return mengeVal;
  };

  const actualAmount = getActualAmount();
  
  const calcKcal = () => ((parseNum(basisKcal) / 100) * actualAmount) || 0;
  const calcEiweiss = () => ((parseNum(basisEiweiss) / 100) * actualAmount) || 0;
  const calcFett = () => ((parseNum(basisFett) / 100) * actualAmount) || 0;
  const calcKh = () => ((parseNum(basisKh) / 100) * actualAmount) || 0;

  // Calculate recipe totals
  const getTotalKcal = () => ingredients.reduce((sum, ing) => sum + ing.kcal, 0);
  const getTotalEiweiss = () => ingredients.reduce((sum, ing) => sum + ing.eiweiss, 0);
  const getTotalFett = () => ingredients.reduce((sum, ing) => sum + ing.fett, 0);
  const getTotalKh = () => ingredients.reduce((sum, ing) => sum + ing.kh, 0);

  const clearForm = () => {
    setName('');
    setBasisKcal('');
    setBasisEiweiss('');
    setBasisFett('');
    setBasisKh('');
    setMenge('100');
    setSelectedUnit('g');
    setUnitWeight('');
    setGptInput('');
  };

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
      const res = await fetch('/api/kalorien-bild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setName(data.name || 'Foto-Schätzung');
        setBasisKcal(String(data.kcal || data.Kalorien || ''));
        setBasisEiweiss(String(data.eiweiss || data.eiweiß || data.Eiweiß || ''));
        setBasisFett(String(data.fett || data.Fett || ''));
        setBasisKh(String(data.kh || data.Kohlenhydrate || ''));
        setMenge(data.menge ? String(data.menge) : '100');
      } else {
        alert(`❌ Foto konnte nicht analysiert werden: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch {
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

  const handleAddIngredient = () => {
    if (!name) return;
    
    const newIngredient: Ingredient = {
      id: Date.now().toString(),
      name,
      kcal: calcKcal(),
      eiweiss: calcEiweiss(),
      fett: calcFett(),
      kh: calcKh(),
      menge: mengeVal,
      unit: selectedUnit,
      unitWeight: unitWeightVal || undefined,
    };

    setIngredients(prev => [...prev, newIngredient]);
    clearForm();
  };

  const removeIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
  };

  const handleUseRecipeClick = () => {
    if (!rezeptName.trim()) {
      alert('❌ Bitte geben Sie einen Rezeptnamen ein');
      return;
    }
    if (ingredients.length === 0) {
      alert('❌ Bitte fügen Sie mindestens eine Zutat hinzu');
      return;
    }
    
    onUseRecipe(
      `Rezept: ${rezeptName}`,
      getTotalKcal(),
      getTotalEiweiss(),
      getTotalFett(),
      getTotalKh()
    );
    
    // Reset form
    setIngredients([]);
    setRezeptName('');
    clearForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={modalStyle}
      >
        <button onClick={onClose} style={closeStyle}>✕</button>
        <h2 style={{ marginBottom: 16, color: '#fff' }}>📖 Rezept Builder</h2>

        {/* Recipe Name */}
        <label style={labelStyle}>Rezept Name:</label>
        <input
          value={rezeptName}
          onChange={e => setRezeptName(e.target.value)}
          placeholder="z.B. Spaghetti Bolognese"
          style={inputStyle}
        />

        {/* Add Ingredient Section */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>➕ Zutat hinzufügen</h3>

          {/* GPT Input */}
          <label style={labelStyle}>GPT Beschreibung:</label>
          <textarea
            value={gptInput}
            onChange={e => setGptInput(e.target.value)}
            placeholder="z. B. 200g Nudeln"
            rows={2}
            style={inputStyle}
          />
          <button onClick={handleGPT} style={buttonStyle}>💡 GPT Schätzen</button>

          {/* Favoriten Button */}
          <button 
            onClick={() => setShowFavoriten(true)} 
            style={{ ...buttonStyle, backgroundColor: '#f39c12', marginBottom: 12 }}
          >
            ⭐ Favoriten durchsuchen
          </button>

          {/* Product name and unit */}
          <label style={labelStyle}>Zutat:</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />

          <label style={labelStyle}>Einheit:</label>
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

          {(selectedUnit === 'Stück' || selectedUnit === 'Portion') && (
            <>
              <label style={labelStyle}>Gewicht pro {selectedUnit} (in g):</label>
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

          <label style={labelStyle}>Menge ({selectedUnit}):</label>
          <input
            value={menge}
            onChange={e => setMenge(e.target.value)}
            inputMode="decimal"
            pattern="[0-9.,]*"
            style={inputStyle}
          />

          {/* Nutrition values */}
          <label style={labelStyle}>Nährwerte pro 100g:</label>
          
          <div style={nutritionRowStyle}>
            <div style={nutritionGroupStyle}>
              <label style={nutritionLabelStyle}>Kcal:</label>
              <input
                value={basisKcal}
                onChange={e => setBasisKcal(e.target.value)}
                inputMode="decimal"
                style={nutritionInputStyle}
              />
              <span style={calcStyle}>{calcKcal().toFixed(1)}</span>
            </div>
            <div style={nutritionGroupStyle}>
              <label style={nutritionLabelStyle}>P:</label>
              <input
                value={basisEiweiss}
                onChange={e => setBasisEiweiss(e.target.value)}
                inputMode="decimal"
                style={nutritionInputStyle}
              />
              <span style={calcStyle}>{calcEiweiss().toFixed(1)}</span>
            </div>
            <div style={nutritionGroupStyle}>
              <label style={nutritionLabelStyle}>F:</label>
              <input
                value={basisFett}
                onChange={e => setBasisFett(e.target.value)}
                inputMode="decimal"
                style={nutritionInputStyle}
              />
              <span style={calcStyle}>{calcFett().toFixed(1)}</span>
            </div>
            <div style={nutritionGroupStyle}>
              <label style={nutritionLabelStyle}>KH:</label>
              <input
                value={basisKh}
                onChange={e => setBasisKh(e.target.value)}
                inputMode="decimal"
                style={nutritionInputStyle}
              />
              <span style={calcStyle}>{calcKh().toFixed(1)}</span>
            </div>
          </div>

          {/* Photo & Barcode */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16 }}>
            <button onClick={() => setScanning(true)} style={{ ...photoButtonStyle, flex: 1 }}>
              📷 Barcode
            </button>
            <label style={{ ...photoButtonStyle, flex: 1 }}>
              📸 Foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  if (!file.type.startsWith('image/')) {
                    alert('❌ Bitte wählen Sie eine Bilddatei aus');
                    return;
                  }
                  
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

          <button 
            onClick={handleAddIngredient} 
            style={{ ...buttonStyle, backgroundColor: '#27ae60' }}
            disabled={!name}
          >
            ➕ Zutat hinzufügen
          </button>
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 && (
          <div style={sectionStyle}>
            <h3 style={sectionTitleStyle}>📝 Zutaten ({ingredients.length})</h3>
            <div style={ingredientListStyle}>
              {ingredients.map(ingredient => (
                <div key={ingredient.id} style={ingredientItemStyle}>
                  <div style={ingredientInfoStyle}>
                    <div style={ingredientNameStyle}>{ingredient.name}</div>
                    <div style={ingredientDetailsStyle}>
                      {ingredient.menge}{ingredient.unit} • {ingredient.kcal.toFixed(1)} kcal • 
                      P: {ingredient.eiweiss.toFixed(1)}g • F: {ingredient.fett.toFixed(1)}g • 
                      KH: {ingredient.kh.toFixed(1)}g
                    </div>
                  </div>
                  <button 
                    onClick={() => removeIngredient(ingredient.id)}
                    style={removeButtonStyle}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>

            {/* Recipe Totals */}
            <div style={totalsStyle}>
              <h4 style={totalsHeaderStyle}>Gesamtwerte:</h4>
              <div style={totalsRowStyle}>
                <span>{getTotalKcal().toFixed(1)} kcal</span>
                <span>P: {getTotalEiweiss().toFixed(1)}g</span>
                <span>F: {getTotalFett().toFixed(1)}g</span>
                <span>KH: {getTotalKh().toFixed(1)}g</span>
              </div>
            </div>

            <button 
              onClick={handleUseRecipeClick} 
              style={{ ...buttonStyle, backgroundColor: '#3cb043', fontSize: 16, padding: '12px' }}
            >
              ✅ Rezept verwenden
            </button>
          </div>
        )}

        {/* Favoriten Modal */}
        <FavoritenModal
          isOpen={showFavoriten}
          onClose={() => setShowFavoriten(false)}
          onSelect={handleFavorit}
        />
      </motion.div>
    </div>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.7)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a', color: '#fff', padding: 20,
  borderRadius: 16, width: '95%', maxWidth: 500,
  maxHeight: '95vh', overflowY: 'auto',
  boxShadow: '0 5px 20px rgba(0,0,0,0.4)',
  position: 'relative',
};

const closeStyle: React.CSSProperties = {
  position: 'absolute', top: 12, right: 12,
  background: 'transparent', color: '#fff',
  fontSize: 20, border: 'none', cursor: 'pointer',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: '#ccc',
  fontSize: 14,
  marginBottom: 4,
  marginTop: 8,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: 8, fontSize: 14,
  marginBottom: 8, borderRadius: 8,
  border: '1px solid #555', backgroundColor: '#1e1e1e',
  color: '#fff',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#36a2eb', color: '#fff', border: 'none',
  borderRadius: 8, padding: '8px 12px', fontSize: 14,
  cursor: 'pointer', width: '100%', marginBottom: 8,
};

const photoButtonStyle: React.CSSProperties = {
  backgroundColor: '#444', border: '1px solid #666',
  borderRadius: 8, fontSize: 14, height: 40,
  padding: '0 10px', display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  color: '#fff',
};

const sectionStyle: React.CSSProperties = {
  border: '1px solid #444',
  borderRadius: 8,
  padding: 16,
  marginBottom: 16,
  backgroundColor: '#333',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  color: '#fff',
  fontSize: 16,
};

const nutritionRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 8,
};

const nutritionGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
};

const nutritionLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
  marginBottom: 4,
};

const nutritionInputStyle: React.CSSProperties = {
  width: '100%',
  padding: 4,
  fontSize: 12,
  borderRadius: 4,
  border: '1px solid #555',
  backgroundColor: '#1e1e1e',
  color: '#fff',
  textAlign: 'center',
  marginBottom: 4,
};

const calcStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#ccc',
  textAlign: 'center',
};

const ingredientListStyle: React.CSSProperties = {
  maxHeight: 200,
  overflowY: 'auto',
  marginBottom: 16,
};

const ingredientItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: 8,
  backgroundColor: '#2a2a2a',
  borderRadius: 8,
  marginBottom: 8,
  border: '1px solid #444',
};

const ingredientInfoStyle: React.CSSProperties = {
  flex: 1,
};

const ingredientNameStyle: React.CSSProperties = {
  fontWeight: 'bold',
  marginBottom: 4,
  color: '#fff',
};

const ingredientDetailsStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
};

const removeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 16,
  cursor: 'pointer',
  padding: 4,
  color: '#ff4444',
};

const totalsStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  padding: 12,
  borderRadius: 8,
  marginBottom: 16,
  border: '2px solid #36a2eb',
};

const totalsHeaderStyle: React.CSSProperties = {
  margin: '0 0 8px 0',
  color: '#36a2eb',
  fontSize: 14,
};

const totalsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  fontWeight: 'bold',
  color: '#fff',
};