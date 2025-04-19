'use client';

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function SportForm({ onClose, onRefresh }: Props) {
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");

  const speichern = async () => {
    const res = await fetch("/api/add-sport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beschreibung: desc, kcal: Number(kcal) }),
    });

    if (res.ok) {
      onRefresh?.();
      onClose();
    } else {
      alert("❌ Fehler beim Speichern");
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
        <h2>🏃 Aktivität eintragen</h2>

        <input
          placeholder="Beschreibung"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="Verbrauchte kcal"
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          style={inputStyle}
        />

        <button onClick={speichern} style={saveStyle}>✅ Speichern</button>
      </motion.div>
    </div>
  );
}

// Style-Blöcke
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const formStyle: React.CSSProperties = {
  backgroundColor: "#2a2a2a",
  color: "#fff",
  padding: 24,
  borderRadius: 16,
  width: "90%",
  maxWidth: 400,
  boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
  position: "relative",
};

const closeStyle: React.CSSProperties = {
  position: "absolute",
  top: 12,
  right: 12,
  background: "transparent",
  color: "#fff",
  fontSize: 20,
  border: "none",
  cursor: "pointer",
};

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

const saveStyle: React.CSSProperties = {
  marginTop: 12,
  backgroundColor: "#3cb043",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 16,
  cursor: "pointer",
  width: "100%",
};
