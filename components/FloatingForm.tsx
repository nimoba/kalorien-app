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
  const [kcal100, setKcal100] = useState("");
  const [eiweiss100, setEiweiss100] = useState("");
  const [fett100, setFett100] = useState("");
  const [kh100, setKh100] = useState("");
  const [menge, setMenge] = useState("100");
  const [scanning, setScanning] = useState(false);
  const [gptInput, setGptInput] = useState("");

  const parse = (val: string) => parseFloat(val || "0");
  const mengeVal = parse(menge);

  const kcal = (parse(kcal100) / 100) * mengeVal;
  const eiweiss = (parse(eiweiss100) / 100) * mengeVal;
  const fett = (parse(fett100) / 100) * mengeVal;
  const kh = (parse(kh100) / 100) * mengeVal;

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
      setKcal100(String(data.Kalorien));
      setEiweiss100(String(data.Eiweiß));
      setFett100(String(data.Fett));
      setKh100(String(data.Kohlenhydrate));
      setGptInput("");
      setMenge("100");
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
      setKcal100(String(data.Kalorien));
      setEiweiss100(String(data.Eiweiß));
      setFett100(String(data.Fett));
      setKh100(String(data.Kohlenhydrate));
      setMenge("100");
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
      setKcal100(String(data.kcal));
      setEiweiss100(String(data.eiweiss));
      setFett100(String(data.fett));
      setKh100(String(data.kh));
      setMenge("100");
    } else {
      alert("❌ Foto konnte nicht analysiert werden");
    }
  };

  const handleSpeichern = async () => {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        kcal,
        eiweiss,
        fett,
        kh,
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
        <h2 style={{ marginBottom: 16 }}>🍽️ Eintrag</h2>

        <textarea
          value={gptInput}
          onChange={(e) => setGptInput(e.target.value)}
          placeholder="z. B. 2 Eier und Toast"
          rows={2}
          style={inputStyle}
        />
        <button onClick={handleGPT} style={buttonStyle}>💡 GPT Schätzen</button>

        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" style={inputStyle} />

        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="number"
            min="1"
            value={menge}
            onChange={(e) => setMenge(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Menge (g/ml)"
          />
          <button
            onClick={() => setScanning(true)}
            style={{ ...buttonStyle, flex: 1, marginBottom: 0 }}
          >
            📷 Barcode
          </button>
        </div>

        <label style={labelStyle}>Kalorien: <span>{kcal.toFixed(1)} kcal</span></label>
        <input type="number" value={kcal100} onChange={(e) => setKcal100(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Eiweiß: <span>{eiweiss.toFixed(1)} g</span></label>
        <input type="number" value={eiweiss100} onChange={(e) => setEiweiss100(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Fett: <span>{fett.toFixed(1)} g</span></label>
        <input type="number" value={fett100} onChange={(e) => setFett100(e.target.value)} style={inputStyle} />

        <label style={labelStyle}>Kohlenhydrate: <span>{kh.toFixed(1)} g</span></label>
        <input type="number" value={kh100} onChange={(e) => setKh100(e.target.value)} style={inputStyle} />

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <label style={fotoButton}>
            📸 Foto
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onloadend = () => {
                  const base64 = reader.result?.toString().split(",")[1];
                  if (base64) handleFoto(base64);
                };
                reader.readAsDataURL(file);
              }}
            />
          </label>
        </div>

        {scanning && (
          <div style={{ marginBottom: 12 }}>
            <BarcodeScanner onDetected={handleBarcode} />
            <button onClick={() => setScanning(false)} style={{ marginTop: 8 }}>❌ Abbrechen</button>
          </div>
        )}

        <button onClick={handleSpeichern} style={{ ...buttonStyle, backgroundColor: "#3cb043" }}>
          ✅ Eintragen
        </button>
      </motion.div>
    </div>
  );
}

// 💄 Style
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
  padding: 10,
  fontSize: 14,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid #555",
  backgroundColor: "#1e1e1e",
  color: "#fff",
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  marginBottom: 4,
  color: "#aaa",
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#36a2eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
  marginBottom: 12,
};

const fotoButton: React.CSSProperties = {
  backgroundColor: "#444",
  border: "1px solid #666",
  borderRadius: 8,
  fontSize: 14,
  height: 42,
  padding: "0 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flex: 1,
};

