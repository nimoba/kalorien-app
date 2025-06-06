'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FloatingTabBar from "../components/FloatingTabBar";
import type { Zutat } from "../pages/api/zutaten";
import type { GeneratedRecipe } from "../pages/api/rezept-generator";

export default function KuehlschrankSeite() {
  const [zutaten, setZutaten] = useState<Zutat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeKategorie, setActiveKategorie] = useState<string>('Alle');
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Neue Zutat hinzufügen
  const [showAddZutat, setShowAddZutat] = useState(false);
  const [newZutatName, setNewZutatName] = useState('');
  const [newZutatKategorie, setNewZutatKategorie] = useState('Sonstiges');
  const [newZutatEinheit, setNewZutatEinheit] = useState('g');

  // Präferenzen für Rezept-Generierung
  const [zielKalorien, setZielKalorien] = useState('');
  const [maxZeit, setMaxZeit] = useState(30);
  const [stil, setStil] = useState('ausgewogen');

  useEffect(() => {
    loadZutaten();
  }, []);

  const loadZutaten = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/zutaten');
      const data = await res.json();
      if (res.ok) {
        setZutaten(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zutaten:', error);
    }
    setLoading(false);
  };

  const saveZutaten = async () => {
    try {
      const res = await fetch('/api/zutaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zutaten }),
      });
      if (res.ok) {
        console.log('✅ Zutaten gespeichert');
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  };

  const toggleZutat = (index: number) => {
    const updated = [...zutaten];
    updated[index].verfügbar = !updated[index].verfügbar;
    setZutaten(updated);
    saveZutaten();
  };

  const updateMenge = (index: number, menge: string) => {
    const updated = [...zutaten];
    updated[index].menge = menge;
    setZutaten(updated);
  };

  const addNewZutat = async () => {
    if (!newZutatName.trim()) {
      alert('⚠️ Bitte Namen eingeben');
      return;
    }

    // Prüfen ob Zutat bereits existiert
    const exists = zutaten.some(z => 
      z.name.toLowerCase() === newZutatName.toLowerCase().trim()
    );

    if (exists) {
      alert('⚠️ Diese Zutat existiert bereits');
      return;
    }

    const neueZutat: Zutat = {
      name: newZutatName.trim(),
      kategorie: newZutatKategorie,
      verfügbar: true,
      menge: '',
      einheit: newZutatEinheit
    };

    const updatedZutaten = [...zutaten, neueZutat];
    setZutaten(updatedZutaten);

    // Speichern
    try {
      const res = await fetch('/api/zutaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zutaten: updatedZutaten }),
      });
      if (res.ok) {
        console.log('✅ Neue Zutat hinzugefügt');
        // Form zurücksetzen
        setNewZutatName('');
        setNewZutatKategorie('Sonstiges');
        setNewZutatEinheit('g');
        setShowAddZutat(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('❌ Fehler beim Speichern der neuen Zutat');
    }
  };

  const generateRecipe = async () => {
    const verfügbareZutaten = zutaten.filter(z => z.verfügbar);
    
    if (verfügbareZutaten.length < 2) {
      alert('⚠️ Mindestens 2 Zutaten sind erforderlich');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/rezept-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verfügbareZutaten,
          präferenzen: {
            zielKalorien: zielKalorien ? Number(zielKalorien) : null,
            maxZeit,
            stil,
          }
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedRecipe(data);
      } else {
        alert('❌ Fehler bei Rezept-Generierung: ' + data.error);
      }
    } catch (error) {
      console.error('Fehler bei Rezept-Generierung:', error);
      alert('❌ Fehler bei Rezept-Generierung');
    }
    setGenerating(false);
  };

  // Kategorien für Filter
  const kategorien = ['Alle', ...new Set(zutaten.map(z => z.kategorie))];
  
  // Gefilterte Zutaten
  const filteredZutaten = zutaten.filter(z => {
    const matchesKategorie = activeKategorie === 'Alle' || z.kategorie === activeKategorie;
    const matchesSearch = z.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesKategorie && matchesSearch;
  });

  const verfügbareCount = zutaten.filter(z => z.verfügbar).length;

  if (loading) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "#fff", textAlign: "center" }}>⏳ Lade Kühlschrank...</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1>🍳 Recipe Generator</h1>
      <p style={{ color: '#ccc', marginBottom: 24 }}>
        Wähle deine verfügbaren Zutaten und lass dir ein Rezept generieren!
      </p>

      {/* Stats */}
      <div style={statsStyle}>
        <div style={statItemStyle}>
          <span style={statNumberStyle}>{verfügbareCount}</span>
          <span style={statLabelStyle}>Verfügbare Zutaten</span>
        </div>
        <div style={statItemStyle}>
          <span style={statNumberStyle}>{zutaten.length}</span>
          <span style={statLabelStyle}>Gesamt</span>
        </div>
      </div>

      {/* Präferenzen */}
      <div style={preferencesStyle}>
        <h3 style={{ color: '#fff', marginBottom: 16 }}>⚙️ Rezept-Präferenzen</h3>
        
        <div style={prefRowStyle}>
          <div style={prefItemStyle}>
            <label style={labelStyle}>Ziel-Kalorien:</label>
            <input
              type="number"
              value={zielKalorien}
              onChange={(e) => setZielKalorien(e.target.value)}
              placeholder="Optional"
              style={smallInputStyle}
            />
          </div>
          
          <div style={prefItemStyle}>
            <label style={labelStyle}>Max. Zeit:</label>
            <input
              type="number"
              value={maxZeit}
              onChange={(e) => setMaxZeit(Number(e.target.value))}
              style={smallInputStyle}
            />
            <span style={unitStyle}>min</span>
          </div>
        </div>

        <div style={prefRowStyle}>
          <label style={labelStyle}>Stil:</label>
          <select
            value={stil}
            onChange={(e) => setStil(e.target.value)}
            style={selectStyle}
          >
            <option value="ausgewogen">Ausgewogen</option>
            <option value="low-carb">Low-Carb</option>
            <option value="high-protein">High-Protein</option>
            <option value="vegetarisch">Vegetarisch</option>
            <option value="schnell">Schnell & Einfach</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateRecipe}
        disabled={generating || verfügbareCount < 2}
        style={{
          ...generateButtonStyle,
          opacity: verfügbareCount < 2 ? 0.5 : 1,
          cursor: verfügbareCount < 2 ? 'not-allowed' : 'pointer'
        }}
      >
        {generating ? '⏳ Generiere Rezept...' : '🍳 Rezept generieren'}
      </button>

      {/* Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Zutaten suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...searchStyle, marginBottom: 0 }}
        />
        <button
          onClick={() => setShowAddZutat(true)}
          style={addZutatButtonStyle}
        >
          ➕
        </button>
      </div>

      {/* Kategorie Filter */}
      <div style={filterStyle}>
        {kategorien.map(kat => (
          <button
            key={kat}
            onClick={() => setActiveKategorie(kat)}
            style={{
              ...filterButtonStyle,
              backgroundColor: activeKategorie === kat ? '#36a2eb' : '#444',
              color: activeKategorie === kat ? '#fff' : '#ccc'
            }}
          >
            {kat}
          </button>
        ))}
      </div>

      {/* Zutaten Liste */}
      <div style={zutatenListStyle}>
        {filteredZutaten.map((zutat, index) => {
          const originalIndex = zutaten.findIndex(z => z.name === zutat.name);
          return (
            <motion.div
              key={zutat.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                ...zutatItemStyle,
                backgroundColor: zutat.verfügbar ? '#2d5a2d' : '#2a2a2a',
                borderColor: zutat.verfügbar ? '#4ade80' : '#444'
              }}
            >
              <div style={zutatInfoStyle}>
                <span style={zutatNameStyle}>{zutat.name}</span>
                <span style={zutatKategorieStyle}>{zutat.kategorie}</span>
              </div>

              <div style={zutatControlsStyle}>
                <input
                  type="text"
                  value={zutat.menge}
                  onChange={(e) => updateMenge(originalIndex, e.target.value)}
                  placeholder="Menge"
                  style={mengeInputStyle}
                />
                <span style={einheitStyle}>{zutat.einheit}</span>
                
                <button
                  onClick={() => toggleZutat(originalIndex)}
                  style={{
                    ...toggleButtonStyle,
                    backgroundColor: zutat.verfügbar ? '#22c55e' : '#64748b'
                  }}
                >
                  {zutat.verfügbar ? '✓' : '+'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Generated Recipe */}
      {generatedRecipe && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={recipeStyle}
        >
          <h2 style={{ color: '#fff', marginBottom: 16 }}>🍽️ {generatedRecipe.name}</h2>
          
          <div style={recipeMetaStyle}>
            <span>⏱️ {generatedRecipe.zubereitungszeit} min</span>
            <span>👥 {generatedRecipe.portionen} Portionen</span>
            <span>📊 {generatedRecipe.schwierigkeit}</span>
          </div>

          <div style={nutritionStyle}>
            <div style={nutritionItemStyle}>
              <span style={nutritionNumberStyle}>{generatedRecipe.nährwerte.kcal}</span>
              <span style={nutritionLabelStyle}>kcal</span>
            </div>
            <div style={nutritionItemStyle}>
              <span style={nutritionNumberStyle}>{generatedRecipe.nährwerte.protein}g</span>
              <span style={nutritionLabelStyle}>Protein</span>
            </div>
            <div style={nutritionItemStyle}>
              <span style={nutritionNumberStyle}>{generatedRecipe.nährwerte.fett}g</span>
              <span style={nutritionLabelStyle}>Fett</span>
            </div>
            <div style={nutritionItemStyle}>
              <span style={nutritionNumberStyle}>{generatedRecipe.nährwerte.kohlenhydrate}g</span>
              <span style={nutritionLabelStyle}>KH</span>
            </div>
          </div>

          <h3 style={{ color: '#fff', marginTop: 24, marginBottom: 12 }}>📝 Zutaten:</h3>
          <ul style={ingredientListStyle}>
            {generatedRecipe.zutaten.map((zutat, i) => (
              <li key={i} style={ingredientItemStyle}>
                {zutat.menge} {zutat.einheit} {zutat.name}
              </li>
            ))}
          </ul>

          <h3 style={{ color: '#fff', marginTop: 24, marginBottom: 12 }}>👨‍🍳 Zubereitung:</h3>
          <ol style={instructionListStyle}>
            {generatedRecipe.anleitung.map((schritt, i) => (
              <li key={i} style={instructionItemStyle}>
                {schritt}
              </li>
            ))}
          </ol>

          <button
            onClick={() => setGeneratedRecipe(null)}
            style={closeRecipeButtonStyle}
          >
            ✕ Rezept schließen
          </button>
        </motion.div>
      )}

      {/* Add Zutat Modal */}
      {showAddZutat && (
        <div style={modalOverlayStyle}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={addZutatModalStyle}
          >
            <h3 style={{ color: '#fff', marginBottom: 20 }}>➕ Neue Zutat hinzufügen</h3>
            
            <label style={modalLabelStyle}>Name:</label>
            <input
              type="text"
              value={newZutatName}
              onChange={(e) => setNewZutatName(e.target.value)}
              placeholder="z.B. Basilikum, Quinoa, ..."
              style={modalInputStyle}
              autoFocus
            />

            <label style={modalLabelStyle}>Kategorie:</label>
            <select
              value={newZutatKategorie}
              onChange={(e) => setNewZutatKategorie(e.target.value)}
              style={modalSelectStyle}
            >
              <option value="Proteine">Proteine</option>
              <option value="Gemüse">Gemüse</option>
              <option value="Kohlenhydrate">Kohlenhydrate</option>
              <option value="Milchprodukte">Milchprodukte</option>
              <option value="Fette & Öle">Fette & Öle</option>
              <option value="Gewürze">Gewürze</option>
              <option value="Obst">Obst</option>
              <option value="Sonstiges">Sonstiges</option>
            </select>

            <label style={modalLabelStyle}>Standard-Einheit:</label>
            <select
              value={newZutatEinheit}
              onChange={(e) => setNewZutatEinheit(e.target.value)}
              style={modalSelectStyle}
            >
              <option value="g">Gramm (g)</option>
              <option value="ml">Milliliter (ml)</option>
              <option value="Stück">Stück</option>
              <option value="EL">Esslöffel (EL)</option>
              <option value="TL">Teelöffel (TL)</option>
              <option value="Prise">Prise</option>
              <option value="Dose">Dose</option>
              <option value="Packung">Packung</option>
            </select>

            <div style={modalButtonsStyle}>
              <button
                onClick={() => setShowAddZutat(false)}
                style={modalCancelButtonStyle}
              >
                Abbrechen
              </button>
              <button
                onClick={addNewZutat}
                style={modalSaveButtonStyle}
              >
                ✅ Hinzufügen
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <FloatingTabBar />
    </div>
  );
}

// === STYLES ===
const containerStyle: React.CSSProperties = {
  padding: "24px",
  paddingBottom: 100,
  backgroundColor: "#2c2c2c",
  minHeight: "100vh",
  color: "#fff",
};

const statsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 24,
};

const statItemStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  borderRadius: 12,
  padding: 16,
  textAlign: 'center',
  flex: 1,
};

const statNumberStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 24,
  fontWeight: 'bold',
  color: '#4ade80',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#ccc',
};

const preferencesStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  borderRadius: 12,
  padding: 20,
  marginBottom: 24,
};

const prefRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 12,
  alignItems: 'center',
};

const prefItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#ccc',
  minWidth: 80,
};

const smallInputStyle: React.CSSProperties = {
  width: 80,
  padding: 6,
  fontSize: 14,
  borderRadius: 6,
  border: '1px solid #555',
  backgroundColor: '#2a2a2a',
  color: '#fff',
};

const unitStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
};

const selectStyle: React.CSSProperties = {
  padding: 8,
  fontSize: 14,
  borderRadius: 6,
  border: '1px solid #555',
  backgroundColor: '#2a2a2a',
  color: '#fff',
  flex: 1,
};

const generateButtonStyle: React.CSSProperties = {
  backgroundColor: '#22c55e',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '16px 24px',
  fontSize: 18,
  fontWeight: 'bold',
  cursor: 'pointer',
  width: '100%',
  marginBottom: 24,
  transition: 'all 0.2s',
};

const searchStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: 16,
  borderRadius: 12,
  border: '2px solid #444',
  backgroundColor: '#1e1e1e',
  color: '#fff',
  flex: 1,
};

const addZutatButtonStyle: React.CSSProperties = {
  backgroundColor: '#22c55e',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: 12,
  fontSize: 18,
  cursor: 'pointer',
  width: 48,
  height: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001,
  backdropFilter: 'blur(4px)',
};

const addZutatModalStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 16,
  padding: 24,
  width: '90%',
  maxWidth: 400,
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const modalLabelStyle: React.CSSProperties = {
  display: 'block',
  color: '#ccc',
  fontSize: 14,
  marginBottom: 8,
  marginTop: 16,
};

const modalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: 16,
  borderRadius: 8,
  border: '2px solid #444',
  backgroundColor: '#1e1e1e',
  color: '#fff',
  marginBottom: 8,
  outline: 'none',
};

const modalSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  fontSize: 16,
  borderRadius: 8,
  border: '2px solid #444',
  backgroundColor: '#1e1e1e',
  color: '#fff',
  marginBottom: 8,
};

const modalButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 24,
};

const modalCancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: 12,
  fontSize: 16,
  borderRadius: 8,
  border: '1px solid #666',
  backgroundColor: '#444',
  color: '#fff',
  cursor: 'pointer',
};

const modalSaveButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: 12,
  fontSize: 16,
  borderRadius: 8,
  border: 'none',
  backgroundColor: '#22c55e',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 'bold',
};

const filterStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 20,
  flexWrap: 'wrap',
};

const filterButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 20,
  border: 'none',
  fontSize: 14,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const zutatenListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 24,
};

const zutatItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 16,
  borderRadius: 12,
  border: '2px solid',
  transition: 'all 0.2s',
};

const zutatInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const zutatNameStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 16,
  fontWeight: '500',
  color: '#fff',
  marginBottom: 4,
};

const zutatKategorieStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
};

const zutatControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
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

const einheitStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#aaa',
  minWidth: 40,
};

const toggleButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 8,
  border: 'none',
  color: '#fff',
  fontSize: 16,
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const recipeStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  borderRadius: 16,
  padding: 24,
  marginTop: 24,
  border: '2px solid #4ade80',
  position: 'relative',
};

const recipeMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
  fontSize: 14,
  color: '#ccc',
};

const nutritionStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
  marginBottom: 24,
};

const nutritionItemStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 8,
  padding: 12,
  textAlign: 'center',
};

const nutritionNumberStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 18,
  fontWeight: 'bold',
  color: '#4ade80',
};

const nutritionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#aaa',
};

const ingredientListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const ingredientItemStyle: React.CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid #333',
  color: '#ccc',
  fontSize: 14,
};

const instructionListStyle: React.CSSProperties = {
  paddingLeft: 20,
  margin: 0,
};

const instructionItemStyle: React.CSSProperties = {
  marginBottom: 12,
  color: '#ccc',
  fontSize: 14,
  lineHeight: 1.5,
};

const closeRecipeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  backgroundColor: '#ef4444',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 14,
  cursor: 'pointer',
};