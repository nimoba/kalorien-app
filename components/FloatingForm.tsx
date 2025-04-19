'use client';

import { useState } from "react";
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

  const parse = (val: string) => parseFloat(val || "0");
  const mengeVal = parse(menge);

  const kcal = (parse(basisKcal) / 100) * mengeVal;
  const eiweiss = (parse(basisEiweiss) / 100) * mengeVal;
  const fett = (parse(basisFett) / 100) * mengeVal;
  const kh = (parse(basisKh) / 100) * mengeVal;

  const updateBasis = (value: number, setter: (v: string) => void) => {
    const basis = (value / mengeVal) * 100;
    setter(basis.toFixed(2));
  };

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
      setMenge("100");
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
      setBasisKcal(String(data.kcal));
      setBasisEiweiss(String(data.eiweiss));
      setBasisFett(String(data.fett));
      setBasisKh(String(data.kh));
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
        <h2>➕ Neuer Eintrag</h2>

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
        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
        />

        <label>Menge (g/ml):</label>
        <input
          type="number"
          value={menge}
          onChange={(e) => setMenge(e.target.value)}
          style={inputStyle}
        />

        <label>Kalorien:</label>
        <input
          type="number"
          value={kcal.toFixed(1)}
          onChange={(e) => updateBasis(parseFloat(e.target.value || "0"), setBasisKcal)}
          style={inputStyle}
        />

        {/* Kompakte Makros */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 16 }}>
          <label style={macroLabelStyle}>KH</label>
          <input
            type="number"
            value={kh.toFixed(1)}
            onChange={(e) => updateBasis(parseFloat(e.target.value || "0"), setBasisKh)}
            style={macroInputStyle}
          />

          <label style={macroLabelStyle}>F</label>
          <input
            type="number"
            value={fett.toFixed(1)}
            onChange={(e) => updateBasis(parseFloat(e.target.value || "0"), setBasisFett)}
            style={macroInputStyle}
          />

          <label style={macroLabelStyle}>P</label>
          <input
            type="number"
            value={eiweiss.toFixed(1)}
            onChange={(e) => updateBasis(parseFloat(e.target.value || "0"), setBasisEiweiss)}
            style={macroInputStyle}
          />
        </div>

        {/* Foto & Barcode Buttons weiter oben */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => setScanning(true)}
            style={{ ...fotoButtonStyle, flex: 1 }}
          >
            📷 Barcode
          </button>

          <label style={{ ...fotoButtonStyle, flex: 1 }}>
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

// STYLES
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
  marginBottom: 12,
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
  padding: "10px 12px",
  fontSize: 14,
  cursor: "pointer",
  width: "100%",
  marginBottom: 12,
};

const fotoButtonStyle: React.CSSProperties = {
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
};

const macroInputStyle: React.CSSProperties = {
  width: 50,
  padding: 6,
  fontSize: 13,
  borderRadius: 6,
  border: "1px solid #555",
  backgroundColor: "#1e1e1e",
  color: "#fff",
};

const macroLabelStyle: React.CSSProperties = {
  fontSize: 12,
  marginRight: 4,
};
