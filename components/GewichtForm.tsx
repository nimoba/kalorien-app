'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function GewichtForm({ onClose, onRefresh }: Props) {
  const [gewicht, setGewicht] = useState("");
  const [fett, setFett] = useState("");
  const [muskel, setMuskel] = useState("");
  const [wasser, setWasser] = useState("");
  const [loading, setLoading] = useState(false);

  const speichern = async () => {
    if (!gewicht) {
      alert("Bitte Gewicht eingeben");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/save-gewicht", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gewicht: parseFloat(gewicht),
        fett: fett ? parseFloat(fett) : null,
        muskel: muskel ? parseFloat(muskel) : null,
        wasser: wasser ? parseFloat(wasser) : null,
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

  const fields = [
    { label: "Gewicht", value: gewicht, setValue: setGewicht, unit: "kg", icon: scaleIcon, required: true, color: "#6366f1" },
    { label: "Körperfett", value: fett, setValue: setFett, unit: "%", icon: fatIcon, required: false, color: "#f97316" },
    { label: "Wasseranteil", value: wasser, setValue: setWasser, unit: "%", icon: waterIcon, required: false, color: "#06b6d4" },
    { label: "Muskelmasse", value: muskel, setValue: setMuskel, unit: "%", icon: muscleIcon, required: false, color: "#10b981" },
  ];

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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18" />
                <rect x="4" y="8" width="16" height="12" rx="2" />
                <path d="M8 8V6a4 4 0 0 1 8 0v2" />
              </svg>
            </div>
            <div>
              <h2 style={titleStyle}>Gewicht eintragen</h2>
              <p style={subtitleStyle}>Körperdaten erfassen</p>
            </div>
            <button onClick={onClose} style={closeButtonStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form Fields */}
          <div style={formContainerStyle}>
            {fields.map((field, index) => (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={fieldStyle}
              >
                <div style={{ ...fieldIconStyle, background: `${field.color}15` }}>
                  {field.icon}
                </div>
                <div style={fieldContentStyle}>
                  <label style={labelStyle}>
                    {field.label}
                    {field.required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
                  </label>
                  <div style={inputWrapperStyle}>
                    <input
                      type="number"
                      value={field.value}
                      onChange={(e) => field.setValue(e.target.value)}
                      placeholder="—"
                      style={inputStyle}
                    />
                    <span style={{ ...unitStyle, color: field.color }}>{field.unit}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Save Button */}
          <motion.button
            onClick={speichern}
            disabled={loading || !gewicht}
            whileHover={{ scale: gewicht ? 1.02 : 1 }}
            whileTap={{ scale: gewicht ? 0.98 : 1 }}
            style={{
              ...saveButtonStyle,
              opacity: !gewicht ? 0.5 : 1,
              cursor: !gewicht ? 'not-allowed' : 'pointer',
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
                <span>Eintragen</span>
              </>
            )}
          </motion.button>
        </motion.div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  );
}

// Icons
const scaleIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18" />
    <rect x="4" y="8" width="16" height="12" rx="2" />
  </svg>
);

const fatIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

const waterIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

const muscleIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5c1.5-1.5 3.5-2 5.5-2s4 .5 5.5 2" />
    <path d="M17.5 17.5c-1.5 1.5-3.5 2-5.5 2s-4-.5-5.5-2" />
    <path d="M3 12h4l2-3 2 6 2-6 2 3h4" />
  </svg>
);

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
  background: "rgba(99, 102, 241, 0.15)",
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

const inputWrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px 0",
  fontSize: 18,
  fontWeight: 600,
  border: "none",
  background: "transparent",
  color: "#fff",
  outline: "none",
  width: "100%",
};

const unitStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
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
