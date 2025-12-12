'use client';

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function SportForm({ onClose, onRefresh }: Props) {
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");
  const [loading, setLoading] = useState(false);
  const [gptLoading, setGptLoading] = useState(false);
  const [gewicht, setGewicht] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gewicht-latest")
      .then((res) => res.json())
      .then((data) => {
        if (data.gewicht) {
          setGewicht(data.gewicht);
        }
      })
      .catch((err) => {
        console.warn("Gewicht konnte nicht geladen werden", err);
      });
  }, []);

  const speichern = async () => {
    if (!desc || !kcal) {
      alert("Bitte alle Felder ausfüllen");
      return;
    }

    setLoading(true);
    const now = new Date();
    const uhrzeit = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const res = await fetch("/api/add-sport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beschreibung: desc,
        kcal: Number(kcal),
        uhrzeit,
      }),
    });

    setLoading(false);

    if (res.ok) {
      onRefresh?.();
      onClose();
    } else {
      alert("Fehler beim Speichern");
    }
  };

  const schaetzeMitGPT = async () => {
    if (!desc) return alert("Bitte Beschreibung eingeben");
    if (!gewicht) return alert("Gewicht konnte nicht geladen werden");

    setGptLoading(true);

    const res = await fetch("/api/sport-gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beschreibung: desc,
        gewicht,
      }),
    });

    const data = await res.json();
    setGptLoading(false);

    if (res.ok) {
      setKcal(String(data.kcal));
    } else {
      alert("GPT konnte nichts berechnen");
    }
  };

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
            <div>
              <h2 style={titleStyle}>Aktivität eintragen</h2>
              <p style={subtitleStyle}>Verbrannte Kalorien erfassen</p>
            </div>
            <button onClick={onClose} style={closeButtonStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div style={formContainerStyle}>
            {/* Description Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              style={fieldStyle}
            >
              <div style={{ ...fieldIconStyle, background: "rgba(139, 92, 246, 0.15)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div style={fieldContentStyle}>
                <label style={labelStyle}>Beschreibung</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="z.B. 30 min Joggen"
                  style={inputStyle}
                />
              </div>
            </motion.div>

            {/* Calories Field with GPT Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={fieldStyle}
            >
              <div style={{ ...fieldIconStyle, background: "rgba(249, 115, 22, 0.15)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </div>
              <div style={fieldContentStyle}>
                <label style={labelStyle}>Verbrauchte Kalorien</label>
                <div style={kcalInputContainerStyle}>
                  <input
                    type="number"
                    value={kcal}
                    onChange={(e) => setKcal(e.target.value)}
                    placeholder="—"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <span style={unitStyle}>kcal</span>
                </div>
              </div>
              <motion.button
                onClick={schaetzeMitGPT}
                disabled={gptLoading || !gewicht || !desc}
                whileHover={{ scale: desc && gewicht ? 1.05 : 1 }}
                whileTap={{ scale: desc && gewicht ? 0.95 : 1 }}
                style={{
                  ...gptButtonStyle,
                  opacity: (!desc || !gewicht) ? 0.4 : 1,
                  cursor: (!desc || !gewicht) ? 'not-allowed' : 'pointer',
                }}
              >
                {gptLoading ? (
                  <div style={miniSpinnerStyle} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
              </motion.button>
            </motion.div>

            {/* GPT Hint */}
            {gewicht && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={hintStyle}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>GPT kann Kalorien basierend auf {gewicht}kg schätzen</span>
              </motion.div>
            )}
          </div>

          {/* Save Button */}
          <motion.button
            onClick={speichern}
            disabled={loading || !desc || !kcal}
            whileHover={{ scale: desc && kcal ? 1.02 : 1 }}
            whileTap={{ scale: desc && kcal ? 0.98 : 1 }}
            style={{
              ...saveButtonStyle,
              opacity: (!desc || !kcal) ? 0.5 : 1,
              cursor: (!desc || !kcal) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <div style={spinnerStyle} />
                <span>Speichere...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Speichern</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0, 0, 0, 0.8)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1001,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: "#1c1c26",
  borderRadius: 24,
  width: "100%",
  maxWidth: 420,
  overflow: "hidden",
  border: "1px solid rgba(255, 255, 255, 0.1)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "20px 20px 16px 20px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
};

const headerIconStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: "rgba(249, 115, 22, 0.15)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: "#fff",
  letterSpacing: "-0.02em",
};

const subtitleStyle: React.CSSProperties = {
  margin: "2px 0 0 0",
  fontSize: 13,
  color: "#71717a",
};

const closeButtonStyle: React.CSSProperties = {
  marginLeft: "auto",
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "none",
  background: "rgba(255, 255, 255, 0.05)",
  color: "#71717a",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const formContainerStyle: React.CSSProperties = {
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 14,
  background: "rgba(255, 255, 255, 0.03)",
  borderRadius: 14,
  border: "1px solid rgba(255, 255, 255, 0.06)",
};

const fieldIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const fieldContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#71717a",
  marginBottom: 4,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 0",
  fontSize: 16,
  fontWeight: 500,
  border: "none",
  background: "transparent",
  color: "#fff",
  outline: "none",
};

const kcalInputContainerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const unitStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#f97316",
};

const gptButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)",
  color: "#a78bfa",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const hintStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 14px",
  background: "rgba(139, 92, 246, 0.1)",
  borderRadius: 10,
  fontSize: 12,
  color: "#a78bfa",
};

const saveButtonStyle: React.CSSProperties = {
  width: "calc(100% - 40px)",
  margin: "0 20px 20px 20px",
  padding: "14px 20px",
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
};

const spinnerStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: "2px solid rgba(255, 255, 255, 0.3)",
  borderTopColor: "#fff",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};

const miniSpinnerStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: "2px solid rgba(167, 139, 250, 0.3)",
  borderTopColor: "#a78bfa",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
};
