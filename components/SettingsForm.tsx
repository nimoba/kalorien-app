'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
      alert("❌ Fehler beim Speichern der Ziele");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
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
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
          position: "relative",
          scrollbarWidth: "thin",
          scrollbarColor: "#555 #2a2a2a",
        } as React.CSSProperties}
      >
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
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h2>⚙️ Ziele anpassen</h2>

        <label>Kalorien-Ziel (kcal):</label>
        <input
          value={kcal}
          onChange={(e) => setKcal(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Eiweiß-Ziel (g):</label>
        <input
          value={eiweiss}
          onChange={(e) => setEiweiss(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Fett-Ziel (g):</label>
        <input
          value={fett}
          onChange={(e) => setFett(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Kohlenhydrate-Ziel (g):</label>
        <input
          value={kh}
          onChange={(e) => setKh(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Startgewicht (kg):</label>
        <input
          value={startgewicht}
          onChange={(e) => setStartgewicht(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Zielgewicht (kg):</label>
        <input
          value={zielGewicht ?? ""}
          onChange={(e) => setZielGewicht(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Täglicher Energieverbrauch (TDEE, kcal):</label>
        <input
          value={tdee ?? ""}
          onChange={(e) => setTdee(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <button
          onClick={speichern}
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
          ✅ Speichern
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
