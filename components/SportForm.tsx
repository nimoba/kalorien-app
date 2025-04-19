'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function SportForm({ onClose, onRefresh }: Props) {
  const [desc, setDesc] = useState("");
  const [kcal, setKcal] = useState("");
  const [loading, setLoading] = useState(false);
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
        console.warn("⚠️ Gewicht konnte nicht geladen werden", err);
      });
  }, []);

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

  const schaetzeMitGPT = async () => {
    if (!desc) return alert("Bitte Beschreibung eingeben");
    if (!gewicht) return alert("❌ Gewicht konnte nicht geladen werden");

    setLoading(true);

    const res = await fetch("/api/sport-gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beschreibung: desc,
        gewicht,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setKcal(String(data.kcal));
    } else {
      alert("❌ GPT konnte nichts berechnen");
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

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            placeholder="Verbrauchte kcal"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
          />
          <button
            onClick={schaetzeMitGPT}
            style={{
              backgroundColor: "#444",
              color: "#fff",
              border: "1px solid #666",
              borderRadius: 8,
              padding: "10px 12px",
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
              minWidth: 40,
            }}
            disabled={loading || !gewicht}
          >
            {loading ? "..." : "💡"}
          </button>
        </div>

        <button onClick={speichern} style={saveStyle}>✅ Speichern</button>
      </motion.div>
    </div>
  );
}

// Styles wie gehabt ...
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
