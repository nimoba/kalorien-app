'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import BarcodeScanner from "./BarcodeScanner";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function FloatingForm({ onClose, onRefresh }: Props) {
  const [name, setName] = useState("");
  const [basisKcal, setBasisKcal] = useState("");
  const [basisEiweiss, setBasisEiweiss] = useState("");
  const [basisFett, setBasisFett] = useState("");
  const [basisKh, setBasisKh] = useState("");
  const [menge, setMenge] = useState("100");
  const [scanning, setScanning] = useState(false);
  const [gptInput, setGptInput] = useState("");

  // Dirty states – merken, ob Nutzer manuell eingegriffen hat
  const [dirtyKcal, setDirtyKcal] = useState(false);
  const [dirtyKh, setDirtyKh] = useState(false);
  const [dirtyFett, setDirtyFett] = useState(false);
  const [dirtyEiweiss, setDirtyEiweiss] = useState(false);

  const parse = (val: string) => parseFloat(val || "0");
  const mengeVal = parse(menge);

  const kcal = (parse(basisKcal) / 100) * mengeVal;
  const eiweiss = (parse(basisEiweiss) / 100) * mengeVal;
  const fett = (parse(basisFett) / 100) * mengeVal;
  const kh = (parse(basisKh) / 100) * mengeVal;

  // 💡 Auto-update Felder bei Mengenänderung (wenn nicht dirty)
  useEffect(() => {
    if (!dirtyKcal) setBasisKcal(((kcal / mengeVal) * 100).toFixed(2));
    if (!dirtyKh) setBasisKh(((kh / mengeVal) * 100).toFixed(2));
    if (!dirtyFett) setBasisFett(((fett / mengeVal) * 100).toFixed(2));
    if (!dirtyEiweiss) setBasisEiweiss(((eiweiss / mengeVal) * 100).toFixed(2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menge]);

  const handleGPT = async () => {
    if (!gptInput) return;
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: gptInput }),
    });
    const data = await res.json();
    if (res.ok) {
      setName(gptInput);
      setBasisKcal(String(data.Kalorien));
      setBasisEiweiss(String(data.Eiweiß));
      setBasisFett(String(data.Fett));
      setBasisKh(String(data.Kohlenhydrate));
      setMenge(data.menge ? String(data.menge) : "100");
      setDirtyKcal(false);
      setDirtyEiweiss(false);
      setDirtyFett(false);
      setDirtyKh(false);
      setGptInput("");
    } else {
      alert("❌ Fehler bei GPT");
    }
  };

  const handleBarcode = async (code: string) => {
    setScanning(false);
    const res = await fetch(`/api/barcode?code=${code}&menge=1`);
    const data = await res.json();

    if (res.ok) {
      setName(data.name);
      setBasisKcal(String(data.Kalorien));
      setBasisEiweiss(String(data.Eiweiß));
      setBasisFett(String(data.Fett));
      setBasisKh(String(data.Kohlenhydrate));
      setMenge(data.menge ? String(data.menge) : "100");
      setDirtyKcal(false);
      setDirtyEiweiss(false);
      setDirtyFett(false);
      setDirtyKh(false);
    } else {
      alert("❌ Produkt nicht gefunden");
    }
  };

  const handleFoto = async (base64: string) => {
    const res = await fetch("/api/kalorien-bild", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64 }),
    });

    const data = await res.json();
    if (res.ok) {
      setName(data.name || "Foto-Schätzung");
      setBasisKcal(String(data.kcal));
      setBasisEiweiss(String(data.eiweiss));
      setBasisFett(String(data.fett));
      setBasisKh(String(data.kh));
      setMenge(data.menge ? String(data.menge) : "100");
      setDirtyKcal(false);
      setDirtyEiweiss(false);
      setDirtyFett(false);
      setDirtyKh(false);
    } else {
      alert("❌ Foto konnte nicht analysiert werden");
    }
  };

  const handleSpeichern = async () => {
    const now = new Date();
    const uhrzeit = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        kcal,
        eiweiss,
        fett,
        kh,
        uhrzeit,
      }),
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
        <h2 style={{ marginBottom: 12 }}>➕ Neuer Eintrag</h2>

        <label>GPT Beschreibung:</label>
        <textarea
          value={gptInput}
          onChange={(e) => setGptInput(e.target.value)}
          placeholder="z. B. 2 Eier und Toast"
          rows={2}
          style={inputStyle}
        />
        <button onClick={handleGPT} style={buttonStyle}>💡 GPT Schätzen</button>

        <label>Produktname:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        <label>Menge (g/ml):</label>
        <input
          value={menge}
          onChange={(e) => setMenge(e.target.value)}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <label>Kalorien:</label>
        <input
          value={basisKcal}
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            setBasisKcal(e.target.value);
            setDirtyKcal(true);
          }}
          inputMode="decimal"
          pattern="[0-9.]*"
          style={inputStyle}
        />

        <div style={macroRow}>
          <div style={macroGroup}>
            <label style={macroLabel}>KH</label>
            <input
              value={basisKh}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setBasisKh(e.target.value);
                setDirtyKh(true);
              }}
              inputMode="decimal"
              pattern="[0-9.]*"
              style={macroInput}
            />
          </div>
          <div style={macroGroup}>
            <label style={macroLabel}>F</label>
            <input
              value={basisFett}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setBasisFett(e.target.value);
                setDirtyFett(true);
              }}
              inputMode="decimal"
              pattern="[0-9.]*"
              style={macroInput}
            />
          </div>
          <div style={macroGroup}>
            <label style={macroLabel}>P</label>
            <input
              value={basisEiweiss}
              onFocus={(e) => e.target.select()}
              onChange={(e) => {
                setBasisEiweiss(e.target.value);
                setDirtyEiweiss(true);
              }}
              inputMode="decimal"
              pattern="[0-9.]*"
              style={macroInput}
            />
          </div>
        </div>

        <button onClick={handleSpeichern} style={{ ...buttonStyle, backgroundColor: "#3cb043" }}>
          ✅ Eintragen
        </button>
      </motion.div>
    </div>
  );
}

// === STYLES ===

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
  padding: 16,
  borderRadius: 16,
  width: "90%",
  maxWidth: 400,
  maxHeight: "90vh",
  overflowY: "auto",
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
  padding: 8,
  fontSize: 14,
  marginBottom: 6,
  borderRadius: 8,
  border: "1px solid #555",
  backgroundColor: "#1e1e1e",
  color: "#fff",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#36a2eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
  marginBottom: 10,
};

const macroRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 6,
};

const macroGroup: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
};

const macroLabel: React.CSSProperties = {
  fontSize: 12,
  color: "#aaa",
};

const macroInput: React.CSSProperties = {
  width: 40,
  padding: 4,
  fontSize: 12,
  borderRadius: 6,
  border: "1px solid #555",
  backgroundColor: "#1e1e1e",
  color: "#fff",
};
