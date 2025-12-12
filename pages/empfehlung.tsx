"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FloatingTabBar from "../components/FloatingTabBar";

interface Vorschlag {
  gericht: string;
  zutaten: string[];
  rezept: string;
  makros: {
    kcal: number;
    eiweiss: number;
    fett: number;
    kh: number;
  };
  preis?: string;
}

export default function EmpfehlungTab() {
  const [stil, setStil] = useState<"vegetarisch" | "alles">("alles");
  const [kalorienProzent, setKalorienProzent] = useState(100);
  const [essensarten, setEssensarten] = useState<string[]>([]);
  const [budget, setBudget] = useState(false);
  const [zeit, setZeit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [vorschlaege, setVorschlaege] = useState<Vorschlag[] | null>(null);
  const [wochenplan, setWochenplan] = useState(false);

  const toggleEssensart = (art: string) => {
    setEssensarten((prev) =>
      prev.includes(art) ? prev.filter((e) => e !== art) : [...prev, art]
    );
  };

  const laden = async () => {
    setLoading(true);
    setVorschlaege(null);

    const res = await fetch("/api/essensvorschlag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stil, kalorienProzent, essensarten, budget, zeit }),
    });

    const data = await res.json();
    setVorschlaege(data);
    setLoading(false);
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={headerStyle}
      >
        <h1 style={titleStyle}>Essensempfehlung</h1>
        <p style={subtitleStyle}>KI-generierte Mahlzeiten für dich</p>
      </motion.div>

      {/* Week Plan Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={weekPlanCardStyle}
      >
        <label style={weekPlanLabelStyle}>
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={wochenplan}
              onChange={() => setWochenplan(!wochenplan)}
              style={{ display: 'none' }}
            />
            <div style={{
              ...customCheckboxStyle,
              background: wochenplan ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: wochenplan ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            }}>
              {wochenplan && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
          <div>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Ganze Woche planen</span>
            <span style={{ display: 'block', color: '#71717a', fontSize: 13, marginTop: 2 }}>Zutaten clever verteilen</span>
          </div>
        </label>
      </motion.div>

      {/* Diet Style Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={cardStyle}
      >
        <h3 style={sectionTitleStyle}>Ernährungsstil</h3>
        <div style={toggleContainerStyle}>
          <button
            onClick={() => setStil("alles")}
            style={{
              ...toggleButtonStyle,
              background: stil === "alles" ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : 'transparent',
              color: stil === "alles" ? '#fff' : '#71717a',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            Alles
          </button>
          <button
            onClick={() => setStil("vegetarisch")}
            style={{
              ...toggleButtonStyle,
              background: stil === "vegetarisch" ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' : 'transparent',
              color: stil === "vegetarisch" ? '#fff' : '#71717a',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 20h10" />
              <path d="M10 20c5.5-2.5.8-6.4 3-10" />
              <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
              <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
            </svg>
            Vegetarisch
          </button>
        </div>
      </motion.div>

      {/* Calorie Percentage Slider */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={cardStyle}
      >
        <div style={sliderHeaderStyle}>
          <h3 style={sectionTitleStyle}>Kalorien-Anteil</h3>
          <span style={sliderValueStyle}>{kalorienProzent}%</span>
        </div>
        <p style={sliderDescStyle}>Wie viel deiner Tages-Kalorien verwenden?</p>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min={10}
            max={100}
            value={kalorienProzent}
            onChange={(e) => setKalorienProzent(Number(e.target.value))}
            style={sliderStyle}
          />
          <div style={sliderTrackStyle}>
            <div style={{ ...sliderFillStyle, width: `${kalorienProzent}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Meal Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={cardStyle}
      >
        <h3 style={sectionTitleStyle}>Mahlzeiten</h3>
        <p style={sliderDescStyle}>Für welche Mahlzeiten sollen Empfehlungen generiert werden?</p>
        <div style={mealButtonsStyle}>
          {[
            { name: 'Frühstück', icon: '☀️' },
            { name: 'Mittagessen', icon: '🌤️' },
            { name: 'Abendessen', icon: '🌙' },
            { name: 'Snack', icon: '🍎' }
          ].map((meal) => (
            <button
              key={meal.name}
              onClick={() => toggleEssensart(meal.name)}
              style={{
                ...mealButtonStyle,
                background: essensarten.includes(meal.name)
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.03)',
                borderColor: essensarten.includes(meal.name)
                  ? 'rgba(99, 102, 241, 0.4)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: essensarten.includes(meal.name) ? '#a5b4fc' : '#71717a',
              }}
            >
              <span style={{ fontSize: 20 }}>{meal.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{meal.name}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Budget & Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={cardStyle}
      >
        {/* Budget Toggle */}
        <label style={budgetLabelStyle}>
          <div style={checkboxContainerStyle}>
            <input
              type="checkbox"
              checked={budget}
              onChange={(e) => setBudget(e.target.checked)}
              style={{ display: 'none' }}
            />
            <div style={{
              ...customCheckboxStyle,
              background: budget ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: budget ? 'transparent' : 'rgba(255, 255, 255, 0.1)',
            }}>
              {budget && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Budget-freundlich</span>
            <span style={{ display: 'block', color: '#71717a', fontSize: 13, marginTop: 2 }}>Günstige Zutaten bevorzugen</span>
          </div>
          <div style={budgetIconStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </label>

        {/* Time Slider */}
        <div style={{ marginTop: 20 }}>
          <div style={sliderHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={timeIconStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>Zeitaufwand</span>
            </div>
            <span style={sliderValueStyle}>{zeit} min</span>
          </div>
          <div style={sliderContainerStyle}>
            <input
              type="range"
              min={0}
              max={100}
              value={zeit}
              onChange={(e) => setZeit(Number(e.target.value))}
              style={sliderStyle}
            />
            <div style={sliderTrackStyle}>
              <div style={{ ...sliderFillStyle, width: `${zeit}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Generate Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={laden}
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={generateButtonStyle}
      >
        {loading ? (
          <>
            <div style={spinnerStyle} />
            <span>GPT denkt nach...</span>
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
              <circle cx="12" cy="12" r="6" />
            </svg>
            <span>Empfehlung generieren</span>
          </>
        )}
      </motion.button>

      {/* Results */}
      <AnimatePresence>
        {vorschlaege && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: 24 }}
          >
            <h3 style={{ ...sectionTitleStyle, marginBottom: 16, color: '#fff' }}>
              Deine Empfehlungen
            </h3>
            {vorschlaege.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                style={recipeCardStyle}
              >
                <h3 style={recipeNameStyle}>{v.gericht}</h3>

                {/* Macros Grid */}
                <div style={macrosGridStyle}>
                  <div style={macroItemStyle}>
                    <span style={{ ...macroValueStyle, color: '#f97316' }}>{v.makros.kcal}</span>
                    <span style={macroLabelStyle}>kcal</span>
                  </div>
                  <div style={macroItemStyle}>
                    <span style={{ ...macroValueStyle, color: '#ef4444' }}>{v.makros.eiweiss}g</span>
                    <span style={macroLabelStyle}>Protein</span>
                  </div>
                  <div style={macroItemStyle}>
                    <span style={{ ...macroValueStyle, color: '#eab308' }}>{v.makros.fett}g</span>
                    <span style={macroLabelStyle}>Fett</span>
                  </div>
                  <div style={macroItemStyle}>
                    <span style={{ ...macroValueStyle, color: '#6366f1' }}>{v.makros.kh}g</span>
                    <span style={macroLabelStyle}>KH</span>
                  </div>
                </div>

                {/* Ingredients */}
                <div style={recipeSectionStyle}>
                  <div style={recipeSectionHeaderStyle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                    <span>Zutaten</span>
                  </div>
                  <p style={recipeTextStyle}>{v.zutaten.join(", ")}</p>
                </div>

                {/* Instructions */}
                <div style={recipeSectionStyle}>
                  <div style={recipeSectionHeaderStyle}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span>Zubereitung</span>
                  </div>
                  <p style={recipeTextStyle}>{v.rezept}</p>
                </div>

                {/* Price */}
                {v.preis && (
                  <div style={priceTagStyle}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <span>{v.preis}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingTabBar />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          border: 2px solid #fff;
        }
        input[type="range"]::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
          border: 2px solid #fff;
        }
      `}</style>
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

const cardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const weekPlanCardStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  border: '1px solid rgba(99, 102, 241, 0.2)',
};

const weekPlanLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  cursor: 'pointer',
};

const checkboxContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const customCheckboxStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: 8,
  border: '2px solid',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#a1a1aa',
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 14,
  background: 'rgba(255, 255, 255, 0.03)',
  padding: 4,
  borderRadius: 14,
};

const toggleButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.2s ease',
};

const sliderHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
};

const sliderValueStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: '#6366f1',
  fontVariantNumeric: 'tabular-nums',
};

const sliderDescStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 13,
  color: '#71717a',
};

const sliderContainerStyle: React.CSSProperties = {
  position: 'relative',
  height: 8,
  marginTop: 8,
};

const sliderTrackStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  left: 0,
  right: 0,
  height: 6,
  background: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 3,
  overflow: 'hidden',
};

const sliderFillStyle: React.CSSProperties = {
  height: '100%',
  background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
  borderRadius: 3,
  transition: 'width 0.1s ease',
};

const sliderStyle: React.CSSProperties = {
  width: '100%',
  margin: 0,
};

const mealButtonsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: 10,
  marginTop: 14,
};

const mealButtonStyle: React.CSSProperties = {
  padding: '14px 12px',
  borderRadius: 14,
  border: '1px solid',
  fontSize: 14,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
  background: 'transparent',
};

const budgetLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  cursor: 'pointer',
};

const budgetIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: 'rgba(245, 158, 11, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const timeIconStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 10,
  background: 'rgba(99, 102, 241, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
};

const spinnerStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const recipeCardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const recipeNameStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: 18,
  fontWeight: 600,
  color: '#fff',
  letterSpacing: '-0.02em',
};

const macrosGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 10,
  marginBottom: 20,
};

const macroItemStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 12,
  padding: '12px 8px',
  textAlign: 'center',
};

const macroValueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 16,
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
};

const macroLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#71717a',
  marginTop: 2,
  display: 'block',
};

const recipeSectionStyle: React.CSSProperties = {
  marginBottom: 16,
};

const recipeSectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 8,
  color: '#a1a1aa',
  fontSize: 13,
  fontWeight: 600,
};

const recipeTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: '#a1a1aa',
  lineHeight: 1.6,
};

const priceTagStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'rgba(16, 185, 129, 0.1)',
  padding: '8px 12px',
  borderRadius: 10,
  fontSize: 14,
  color: '#10b981',
  fontWeight: 600,
};
