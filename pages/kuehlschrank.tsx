'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  // View Mode Toggle
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

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
      alert('Bitte Namen eingeben');
      return;
    }

    const exists = zutaten.some(z =>
      z.name.toLowerCase() === newZutatName.toLowerCase().trim()
    );

    if (exists) {
      alert('Diese Zutat existiert bereits');
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

    try {
      const res = await fetch('/api/zutaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zutaten: updatedZutaten }),
      });
      if (res.ok) {
        setNewZutatName('');
        setNewZutatKategorie('Sonstiges');
        setNewZutatEinheit('g');
        setShowAddZutat(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der neuen Zutat');
    }
  };

  const generateRecipe = async () => {
    const verfügbareZutaten = zutaten.filter(z => z.verfügbar);

    if (verfügbareZutaten.length < 2) {
      alert('Mindestens 2 Zutaten sind erforderlich');
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
        alert('Fehler bei Rezept-Generierung: ' + data.error);
      }
    } catch (error) {
      console.error('Fehler bei Rezept-Generierung:', error);
      alert('Fehler bei Rezept-Generierung');
    }
    setGenerating(false);
  };

  // Kategorien für Filter
  const kategorien = ['Alle', ...new Set(zutaten.map(z => z.kategorie))];

  // Gefilterte Zutaten
  const filteredZutaten = zutaten.filter(z => {
    const matchesKategorie = activeKategorie === 'Alle' || z.kategorie === activeKategorie;
    const matchesSearch = z.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAvailability = !showOnlyAvailable || z.verfügbar;
    return matchesKategorie && matchesSearch && matchesAvailability;
  });

  const verfügbareCount = zutaten.filter(z => z.verfügbar).length;

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />
          <span style={{ color: '#71717a', fontSize: 14 }}>Lade Kühlschrank...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <FloatingTabBar />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={headerStyle}
      >
        <h1 style={titleStyle}>Recipe Generator</h1>
        <p style={subtitleStyle}>Wähle deine Zutaten und generiere Rezepte</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={statsContainerStyle}
      >
        <div style={statCardStyle}>
          <div style={{ ...statIconStyle, background: 'rgba(16, 185, 129, 0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <span style={statNumberStyle}>{verfügbareCount}</span>
            <span style={statLabelStyle}>Verfügbar</span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ ...statIconStyle, background: 'rgba(99, 102, 241, 0.15)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div>
            <span style={statNumberStyle}>{zutaten.length}</span>
            <span style={statLabelStyle}>Gesamt</span>
          </div>
        </div>
      </motion.div>

      {/* Preferences Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={cardStyle}
      >
        <div style={cardHeaderStyle}>
          <div style={cardIconStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </div>
          <h3 style={cardTitleStyle}>Rezept-Präferenzen</h3>
        </div>

        <div style={prefGridStyle}>
          <div style={prefItemStyle}>
            <label style={prefLabelStyle}>Ziel-Kalorien</label>
            <input
              type="number"
              value={zielKalorien}
              onChange={(e) => setZielKalorien(e.target.value)}
              placeholder="Optional"
              style={inputStyle}
            />
          </div>

          <div style={prefItemStyle}>
            <label style={prefLabelStyle}>Max. Zeit (min)</label>
            <input
              type="number"
              value={maxZeit}
              onChange={(e) => setMaxZeit(Number(e.target.value))}
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={prefLabelStyle}>Ernährungsstil</label>
          <div style={selectWrapperStyle}>
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
            <svg style={selectIconStyle} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Generate Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={generateRecipe}
        disabled={generating || verfügbareCount < 2}
        whileHover={{ scale: verfügbareCount >= 2 ? 1.02 : 1 }}
        whileTap={{ scale: verfügbareCount >= 2 ? 0.98 : 1 }}
        style={{
          ...generateButtonStyle,
          opacity: verfügbareCount < 2 ? 0.5 : 1,
          cursor: verfügbareCount < 2 ? 'not-allowed' : 'pointer'
        }}
      >
        {generating ? (
          <>
            <div style={buttonSpinnerStyle} />
            <span>Generiere Rezept...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span>Rezept generieren</span>
          </>
        )}
      </motion.button>

      {/* Search & Add */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={searchContainerStyle}
      >
        <div style={searchInputWrapperStyle}>
          <svg style={searchIconStyle} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Zutaten suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyle}
          />
        </div>
        <button
          onClick={() => setShowAddZutat(true)}
          style={addButtonStyle}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </motion.div>

      {/* View Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={viewToggleContainerStyle}
      >
        <button
          onClick={() => setShowOnlyAvailable(false)}
          style={{
            ...viewToggleButtonStyle,
            background: !showOnlyAvailable ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
            color: !showOnlyAvailable ? '#fff' : '#71717a',
          }}
        >
          Alle ({zutaten.length})
        </button>
        <button
          onClick={() => setShowOnlyAvailable(true)}
          style={{
            ...viewToggleButtonStyle,
            background: showOnlyAvailable ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' : 'transparent',
            color: showOnlyAvailable ? '#fff' : '#71717a',
          }}
        >
          Verfügbar ({verfügbareCount})
        </button>
      </motion.div>

      {/* Quick Overview */}
      <AnimatePresence>
        {showOnlyAvailable && verfügbareCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={quickOverviewStyle}
          >
            <h4 style={quickOverviewTitleStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Deine verfügbaren Zutaten:
            </h4>
            <div style={tagsContainerStyle}>
              {zutaten
                .filter(z => z.verfügbar)
                .slice(0, 12)
                .map(z => (
                  <span key={z.name} style={tagStyle}>
                    {z.name}
                    {z.menge && ` (${z.menge}${z.einheit})`}
                  </span>
                ))}
              {verfügbareCount > 12 && (
                <span style={{ ...tagStyle, background: 'rgba(255, 255, 255, 0.05)', color: '#71717a' }}>
                  +{verfügbareCount - 12} weitere
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={categoryFilterStyle}
      >
        {kategorien.map(kat => (
          <button
            key={kat}
            onClick={() => setActiveKategorie(kat)}
            style={{
              ...categoryButtonStyle,
              background: activeKategorie === kat
                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              borderColor: activeKategorie === kat
                ? 'rgba(99, 102, 241, 0.4)'
                : 'rgba(255, 255, 255, 0.06)',
              color: activeKategorie === kat ? '#a5b4fc' : '#71717a',
            }}
          >
            {kat}
          </button>
        ))}
      </motion.div>

      {/* Ingredients List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <div style={listHeaderStyle}>
          {filteredZutaten.length} {showOnlyAvailable ? 'verfügbare' : ''} Zutaten
          {activeKategorie !== 'Alle' && ` in "${activeKategorie}"`}
          {searchTerm && ` mit "${searchTerm}"`}
        </div>

        <div style={ingredientsListStyle}>
          {filteredZutaten.map((zutat, index) => {
            const originalIndex = zutaten.findIndex(z => z.name === zutat.name);
            return (
              <motion.div
                key={zutat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                style={{
                  ...ingredientItemStyle,
                  background: zutat.verfügbar
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                    : 'rgba(28, 28, 38, 0.6)',
                  borderColor: zutat.verfügbar
                    ? 'rgba(16, 185, 129, 0.3)'
                    : 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={ingredientInfoStyle}>
                  <span style={ingredientNameStyle}>{zutat.name}</span>
                  <span style={ingredientCategoryStyle}>{zutat.kategorie}</span>
                </div>

                <div style={ingredientControlsStyle}>
                  <input
                    type="text"
                    value={zutat.menge}
                    onChange={(e) => updateMenge(originalIndex, e.target.value)}
                    placeholder="—"
                    style={mengeInputStyle}
                  />
                  <span style={einheitLabelStyle}>{zutat.einheit}</span>

                  <button
                    onClick={() => toggleZutat(originalIndex)}
                    style={{
                      ...toggleButtonStyle,
                      background: zutat.verfügbar
                        ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                        : 'rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {zutat.verfügbar ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Generated Recipe */}
      <AnimatePresence>
        {generatedRecipe && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={recipeCardStyle}
          >
            <button
              onClick={() => setGeneratedRecipe(null)}
              style={closeRecipeButtonStyle}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 style={recipeNameStyle}>{generatedRecipe.name}</h2>

            <div style={recipeMetaStyle}>
              <div style={recipeMetaItemStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{generatedRecipe.zubereitungszeit} min</span>
              </div>
              <div style={recipeMetaItemStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>{generatedRecipe.portionen} Portionen</span>
              </div>
              <div style={recipeMetaItemStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span>{generatedRecipe.schwierigkeit}</span>
              </div>
            </div>

            <div style={nutritionGridStyle}>
              <div style={nutritionItemStyle}>
                <span style={{ ...nutritionValueStyle, color: '#f97316' }}>{generatedRecipe.nährwerte.kcal}</span>
                <span style={nutritionLabelStyle}>kcal</span>
              </div>
              <div style={nutritionItemStyle}>
                <span style={{ ...nutritionValueStyle, color: '#ef4444' }}>{generatedRecipe.nährwerte.protein}g</span>
                <span style={nutritionLabelStyle}>Protein</span>
              </div>
              <div style={nutritionItemStyle}>
                <span style={{ ...nutritionValueStyle, color: '#eab308' }}>{generatedRecipe.nährwerte.fett}g</span>
                <span style={nutritionLabelStyle}>Fett</span>
              </div>
              <div style={nutritionItemStyle}>
                <span style={{ ...nutritionValueStyle, color: '#6366f1' }}>{generatedRecipe.nährwerte.kohlenhydrate}g</span>
                <span style={nutritionLabelStyle}>KH</span>
              </div>
            </div>

            <div style={recipeSectionStyle}>
              <h3 style={recipeSectionTitleStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                Zutaten
              </h3>
              <ul style={ingredientListStyle}>
                {generatedRecipe.zutaten.map((zutat, i) => (
                  <li key={i} style={recipeIngredientItemStyle}>
                    <span style={ingredientAmountStyle}>{zutat.menge} {zutat.einheit}</span>
                    <span style={ingredientNameRecipeStyle}>{zutat.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={recipeSectionStyle}>
              <h3 style={recipeSectionTitleStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Zubereitung
              </h3>
              <ol style={instructionListStyle}>
                {generatedRecipe.anleitung.map((schritt, i) => (
                  <li key={i} style={instructionItemStyle}>
                    <span style={instructionStepStyle}>{i + 1}</span>
                    <span style={instructionTextStyle}>{schritt}</span>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Ingredient Modal */}
      <AnimatePresence>
        {showAddZutat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={modalOverlayStyle}
            onClick={() => setShowAddZutat(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={modalStyle}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Neue Zutat</h3>
                <button onClick={() => setShowAddZutat(false)} style={modalCloseButtonStyle}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div style={modalBodyStyle}>
                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Name</label>
                  <input
                    type="text"
                    value={newZutatName}
                    onChange={(e) => setNewZutatName(e.target.value)}
                    placeholder="z.B. Basilikum, Quinoa..."
                    style={formInputStyle}
                    autoFocus
                  />
                </div>

                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Kategorie</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={newZutatKategorie}
                      onChange={(e) => setNewZutatKategorie(e.target.value)}
                      style={formSelectStyle}
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
                    <svg style={selectIconStyle} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>

                <div style={formGroupStyle}>
                  <label style={formLabelStyle}>Einheit</label>
                  <div style={selectWrapperStyle}>
                    <select
                      value={newZutatEinheit}
                      onChange={(e) => setNewZutatEinheit(e.target.value)}
                      style={formSelectStyle}
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
                    <svg style={selectIconStyle} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button onClick={() => setShowAddZutat(false)} style={cancelButtonStyle}>
                  Abbrechen
                </button>
                <button onClick={addNewZutat} style={saveButtonStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Hinzufügen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingTabBar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// === STYLES ===
const containerStyle: React.CSSProperties = {
  padding: "20px",
  paddingBottom: 100,
  backgroundColor: "#0f0f14",
  minHeight: "100vh",
  color: "#fff",
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  gap: 16,
};

const spinnerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  border: '3px solid rgba(99, 102, 241, 0.2)',
  borderTopColor: '#6366f1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const headerStyle: React.CSSProperties = {
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.03em',
  background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0 0',
  fontSize: 14,
  color: '#71717a',
};

const statsContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
  marginBottom: 16,
};

const statCardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 16,
  padding: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const statIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const statNumberStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 22,
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '-0.02em',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#71717a',
};

const cardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 16,
};

const cardIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(139, 92, 246, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 600,
  color: '#fff',
};

const prefGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 12,
};

const prefItemStyle: React.CSSProperties = {};

const prefLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#71717a',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  outline: 'none',
};

const selectWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  paddingRight: 36,
  fontSize: 14,
  borderRadius: 10,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const selectIconStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const generateButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 24px',
  fontSize: 16,
  fontWeight: 600,
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  marginBottom: 16,
  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
};

const buttonSpinnerStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const searchContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginBottom: 12,
};

const searchInputWrapperStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px 12px 44px',
  fontSize: 15,
  borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(28, 28, 38, 0.6)',
  color: '#fff',
  outline: 'none',
};

const addButtonStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const viewToggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
  background: 'rgba(28, 28, 38, 0.6)',
  padding: 4,
  borderRadius: 14,
};

const viewToggleButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  borderRadius: 10,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const quickOverviewStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  border: '1px solid rgba(16, 185, 129, 0.2)',
  overflow: 'hidden',
};

const quickOverviewTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 14,
  fontWeight: 600,
  color: '#10b981',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const tagsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
};

const tagStyle: React.CSSProperties = {
  background: 'rgba(16, 185, 129, 0.2)',
  color: '#34d399',
  padding: '6px 10px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 500,
};

const categoryFilterStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const categoryButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 20,
  border: '1px solid',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const listHeaderStyle: React.CSSProperties = {
  marginBottom: 12,
  fontSize: 13,
  color: '#71717a',
};

const ingredientsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const ingredientItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 14,
  borderRadius: 14,
  border: '1px solid',
  transition: 'all 0.2s ease',
};

const ingredientInfoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const ingredientNameStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 15,
  fontWeight: 500,
  color: '#fff',
  marginBottom: 2,
};

const ingredientCategoryStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#71717a',
};

const ingredientControlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const mengeInputStyle: React.CSSProperties = {
  width: 50,
  padding: '6px 8px',
  fontSize: 13,
  borderRadius: 8,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  textAlign: 'center',
  outline: 'none',
};

const einheitLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#71717a',
  minWidth: 32,
};

const toggleButtonStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const recipeCardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.9)',
  borderRadius: 24,
  padding: 24,
  marginTop: 24,
  border: '1px solid rgba(16, 185, 129, 0.3)',
  position: 'relative',
};

const closeRecipeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  width: 36,
  height: 36,
  borderRadius: 10,
  border: 'none',
  background: 'rgba(239, 68, 68, 0.1)',
  color: '#ef4444',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const recipeNameStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 22,
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '-0.02em',
  paddingRight: 48,
};

const recipeMetaStyle: React.CSSProperties = {
  display: 'flex',
  gap: 16,
  marginBottom: 20,
  flexWrap: 'wrap',
};

const recipeMetaItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 13,
  color: '#a1a1aa',
};

const nutritionGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 10,
  marginBottom: 24,
};

const nutritionItemStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 12,
  padding: '12px 8px',
  textAlign: 'center',
};

const nutritionValueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 18,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};

const nutritionLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#71717a',
  marginTop: 2,
  display: 'block',
};

const recipeSectionStyle: React.CSSProperties = {
  marginBottom: 20,
};

const recipeSectionTitleStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  fontSize: 14,
  fontWeight: 600,
  color: '#a1a1aa',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const ingredientListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const recipeIngredientItemStyle: React.CSSProperties = {
  display: 'flex',
  padding: '10px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
};

const ingredientAmountStyle: React.CSSProperties = {
  width: 80,
  fontSize: 14,
  color: '#10b981',
  fontWeight: 500,
  flexShrink: 0,
};

const ingredientNameRecipeStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#a1a1aa',
};

const instructionListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  counterReset: 'step',
};

const instructionItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  marginBottom: 16,
};

const instructionStepStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  background: 'rgba(139, 92, 246, 0.15)',
  color: '#a78bfa',
  fontSize: 13,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const instructionTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#a1a1aa',
  lineHeight: 1.6,
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
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
  maxWidth: 400,
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const modalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 20px 0 20px',
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: '#fff',
};

const modalCloseButtonStyle: React.CSSProperties = {
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

const modalBodyStyle: React.CSSProperties = {
  padding: 20,
};

const formGroupStyle: React.CSSProperties = {
  marginBottom: 16,
};

const formLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  color: '#71717a',
  marginBottom: 8,
  fontWeight: 500,
};

const formInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 15,
  borderRadius: 12,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  outline: 'none',
};

const formSelectStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  paddingRight: 40,
  fontSize: 15,
  borderRadius: 12,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.03)',
  color: '#fff',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const modalFooterStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  padding: '0 20px 20px 20px',
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 12,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'transparent',
  color: '#71717a',
  cursor: 'pointer',
};

const saveButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 600,
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
};
