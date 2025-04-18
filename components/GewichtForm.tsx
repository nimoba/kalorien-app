'use client';

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function GewichtForm({ onClose, onRefresh }: Props) {
  const [gewicht, setGewicht] = useState("");
  const [fett, setFett] = useState("");
  const [muskel, setMuskel] = useState("");
  const [loading, setLoading] = useState(false);

  const speichern = async () => {
    if (!gewicht) {
      alert("⚠️ Bitte Gewicht eingeben");
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
      }),
    });

    setLoading(false);

    if (res.ok) {
      onRefresh?.();
      onClose();
    } else {
      alert("❌ Fehler beim Speichern");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: "#2a2a2a",
          color: "#fff",
          padding: 24,
          borderRadius: 16,
          width: "90%",
          maxWidth: 400,
          boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
          position: "relative"
        }}
      >
        {/* X Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            color: "#fff",
            fontSize: 20,
            border: "none",
            cursor: "pointer"
          }}
        >
          ✕
        </button>

        <h2>🏋️ Gewicht eintragen</h2>

        <label>Gewicht (kg)*</label>
        <input
          type="number"
          value={gewicht}
          onChange={(e) => setGewicht(e.target.value)}
          style={inputStyle}
        />

        <label>Körperfett (%)</label>
        <input
          type="number"
          value={fett}
          onChange={(e) => setFett(e.target.value)}
          style={inputStyle}
        />

        <label>Muskelmasse (%)</label>
        <input
          type="number"
          value={muskel}
          onChange={(e) => setMuskel(e.target.value)}
          style={inputStyle}
        />

        <button
          onClick={speichern}
          disabled={loading}
          style={{
            marginTop: 20,
            backgroundColor: "#3cb043",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
            width: "100%",
          }}
        >
          {loading ? "Speichere..." : "✅ Eintragen"}
        </button>
      </motion.div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  fontSize: 16,
  marginBottom: 12,
  borderRadius: 8,
  border: "1px solid #555",
  backgroundColor: "#1e1e1e",
  color: "#fff",
};
