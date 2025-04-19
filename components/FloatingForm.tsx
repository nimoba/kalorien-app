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
  const [kcal, setKcal] = useState("");
  const [eiweiss, setEiweiss] = useState("");
  const [fett, setFett] = useState("");
  const [kh, setKh] = useState("");
  const [gramm, setGramm] = useState("100");
  const [menge, setMenge] = useState("1");
  const [scanning, setScanning] = useState(false);
  const [gptInput, setGptInput] = useState("");

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
      setKcal(String(data.Kalorien));
      setEiweiss(String(data.Eiweiß));
      setFett(String(data.Fett));
      setKh(String(data.Kohlenhydrate));
      setGramm("100");
      setGptInput("");
    } else {
      alert("❌ Fehler bei GPT");
    }
  };

  const handleBarcode = async (code: string) => {
    setScanning(false);
    const res = await fetch(`/api/barcode?code=${code}&menge=${menge}`);
    const data = await res.json();
    if (res.ok) {
      setName(data.name);
      setKcal(String(data.Kalorien));
      setEiweiss(String(data.Eiweiß));
      setFett(String(data.Fett));
      setKh(String(data.Kohlenhydrate));
      setGramm("100");
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
      setKcal(String(data.kcal));
      setEiweiss(String(data.eiweiss));
      setFett(String(data.fett));
      setKh(String(data.kh));
      setGramm("100");
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
        kcal: (parseFloat(kcal) / 100) * parseFloat(gramm),
        eiweiss: (parseFloat(eiweiss) / 100) * parseFloat(gramm),
        fett: (parseFloat(fett) / 100) * parseFloat(gramm),
        kh: (parseFloat(kh) / 100) * parseFloat(gramm),
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
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
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
        <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "transparent", color: "#fff", fontSize: 20, border: "none", cursor: "pointer" }}>✕</button>

        <h2>➕ Neuer Eintrag</h2>

        <textarea
          value={gptInput}
          onChange={(e) => setGptInput(e.target.value)}
          placeholder="GPT Beschreibung (z.B. 2 Eier und Toast)"
          rows={2}
          style={inputStyle}
        />
        <button onClick={handleGPT} style={buttonStyle}>💡 GPT Schätzen</button>

        <label>Produktname:</label>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />

        <label>Kalorien / 100g:</label>
        <input type="number" value={kcal} onChange={(e) => setKcal(e.target.value)} style={inputStyle} />

        <label>Eiweiß / 100g:</label>
        <input type="number" value={eiweiss} onChange={(e) => setEiweiss(e.target.value)} style={inputStyle} />

        <label>Fett / 100g:</label>
        <input type="number" value={fett} onChange={(e) => setFett(e.target.value)} style={inputStyle} />

        <label>Kohlenhydrate / 100g:</label>
        <input type="number" value={kh} onChange={(e) => setKh(e.target.value)} style={inputStyle} />

        <label>Gramm / ml:</label>
        <input type="number" value={gramm} onChange={(e) => setGramm(e.target.value)} style={inputStyle} />

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setScanning(true)}
            style={{
              flex: 1,
              backgroundColor: "#444",
              border: "1px solid #666",
              borderRadius: 8,
              fontSize: 16,
              padding: "10px 12px",
              height: 48,
              cursor: "pointer",
            }}
          >
            📷 Barcode
          </button>

          <label style={{
            flex: 1,
            backgroundColor: "#444",
            border: "1px solid #666",
            borderRadius: 8,
            fontSize: 16,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
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

        <button onClick={handleSpeichern} style={{ ...buttonStyle, backgroundColor: "#3cb043", width: "100%" }}>
          ✅ Eintragen
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

const buttonStyle: React.CSSProperties = {
  backgroundColor: "#36a2eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 16px",
  fontSize: 16,
  cursor: "pointer",
  width: "100%",
  marginBottom: 16,
};
