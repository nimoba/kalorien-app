'use client';

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onClose: () => void;
  onSave?: (settings: Ziele) => void;
}

export interface Ziele {
  zielKcal: number;
  zielEiweiss: number;
  zielFett: number;
  zielKh: number;
  zielGewicht?: number | null;
  tdee?: number | null;
}

export default function SettingsForm({ onClose, onSave }: Props) {
  const [kcal, setKcal] = useState("2200");
  const [eiweiss, setEiweiss] = useState("130");
  const [fett, setFett] = useState("70");
  const [kh, setKh] = useState("250");
  const [startgewicht, setStartgewicht] = useState("0");
  const [zielGewicht, setZielGewicht] = useState<string | null>("0");
  const [tdee, setTdee] = useState<string | null>("2600");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("settings");
    if (stored) {
      const parsed = JSON.parse(stored);
      setKcal(String(parsed.kcal));
      setEiweiss(String(parsed.eiweiss));
      setFett(String(parsed.fett));
      setKh(String(parsed.kh));
      setStartgewicht(String(parsed.startgewicht));
      setZielGewicht(parsed.zielGewicht != null ? String(parsed.zielGewicht) : null);
      setTdee(parsed.tdee != null ? String(parsed.tdee) : null);
    }
  }, []);

  const speichern = async () => {
    setIsLoading(true);
    const res = await fetch("/api/save-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kcal: parseFloat(kcal),
        kh: parseFloat(kh),
        eiweiss: parseFloat(eiweiss),
        fett: parseFloat(fett),
        startgewicht: parseFloat(startgewicht),
        zielGewicht: zielGewicht ? parseFloat(zielGewicht) : null,
        tdee: tdee ? parseFloat(tdee) : null,
      }),
    });
    setIsLoading(false);

    if (res.ok) {
      if (onSave) {
        onSave({
          zielKcal: parseFloat(kcal),
          zielEiweiss: parseFloat(eiweiss),
          zielFett: parseFloat(fett),
          zielKh: parseFloat(kh),
          zielGewicht: zielGewicht ? parseFloat(zielGewicht) : null,
          tdee: tdee ? parseFloat(tdee) : null,
        });
      }
      onClose();
    } else {
      alert("Fehler beim Speichern der Ziele");
    }
  };

  const settingsFields = [
    { label: "Kalorien-Ziel", value: kcal, setValue: setKcal, unit: "kcal", icon: "flame" },
    { label: "Eiweiß-Ziel", value: eiweiss, setValue: setEiweiss, unit: "g", icon: "protein" },
    { label: "Fett-Ziel", value: fett, setValue: setFett, unit: "g", icon: "droplet" },
    { label: "Kohlenhydrate-Ziel", value: kh, setValue: setKh, unit: "g", icon: "grain" },
    { label: "Startgewicht", value: startgewicht, setValue: setStartgewicht, unit: "kg", icon: "scale" },
    { label: "Zielgewicht", value: zielGewicht ?? "", setValue: setZielGewicht, unit: "kg", icon: "target" },
    { label: "Täglicher Verbrauch (TDEE)", value: tdee ?? "", setValue: setTdee, unit: "kcal", icon: "zap" },
  ];

  const icons: Record<string, JSX.Element> = {
    flame: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
      </svg>
    ),
    protein: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a9 9 0 0 0-9 9c0 4.17 2.84 7.67 6.69 8.69a3.32 3.32 0 0 0 4.62 0C18.16 18.67 21 15.17 21 11a9 9 0 0 0-9-9z" />
      </svg>
    ),
    droplet: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z" />
      </svg>
    ),
    grain: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44" />
        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44" />
      </svg>
    ),
    scale: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2H8l-4 4v12l4 4h8l4-4V6l-4-4z" />
        <path d="M12 6v12" />
        <path d="M8 12h8" />
      </svg>
    ),
    target: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    zap: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  };

  return (
    <div style={overlayStyle}>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={formStyle}
      >
        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>Einstellungen</h2>
            <p style={subtitleStyle}>Ziele anpassen</p>
          </div>
          <button onClick={onClose} style={closeButtonStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
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

        {/* Settings Fields */}
        <div style={fieldsContainerStyle}>
          {settingsFields.map((field, index) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              style={fieldStyle}
            >
              <div style={fieldHeaderStyle}>
                <div style={iconContainerStyle}>{icons[field.icon]}</div>
                <label style={labelStyle}>{field.label}</label>
              </div>
              <div style={inputWrapperStyle}>
                <input
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  inputMode="decimal"
                  pattern="[0-9.]*"
                  style={inputStyle}
                />
                <span style={unitStyle}>{field.unit}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Save Button */}
        <button onClick={speichern} style={saveButtonStyle} disabled={isLoading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Speichern
        </button>

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
  cursor: 'pointer', color: '#71717a',
};

const loadingOverlayStyle: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15, 15, 20, 0.8)', borderRadius: 24,
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
};

const fieldsContainerStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
};

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 14, padding: 14,
  border: '1px solid rgba(255, 255, 255, 0.04)',
};

const fieldHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
};

const iconContainerStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 10,
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#818cf8',
};

const labelStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 500, color: '#fff',
};

const inputWrapperStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
};

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '10px 14px', fontSize: 16,
  borderRadius: 10, border: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'rgba(22, 22, 29, 0.8)', color: '#fff',
  fontVariantNumeric: 'tabular-nums',
};

const unitStyle: React.CSSProperties = {
  fontSize: 14, color: '#71717a', minWidth: 40,
};

const saveButtonStyle: React.CSSProperties = {
  width: '100%', padding: '14px 20px', fontSize: 15, fontWeight: 600,
  borderRadius: 14, border: 'none', cursor: 'pointer',
  background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', marginTop: 20,
};
