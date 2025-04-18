'use client';

import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh?: () => void;
}

export default function FloatingForm({ onClose, onRefresh }: Props) {
  const [eingabe, setEingabe] = useState("");
  const [menge, setMenge] = useState("1");
  const [scanning, setScanning] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewData, setPreviewData] = useState<null | {
    name: string;
    kcal: number;
    eiweiss: number;
    fett: number;
    kh: number;
  }>(null);
  const [gramm, setGramm] = useState("100");

  const handleBarcode = async (code: string) => {
    setScanning(false);
    const res = await fetch(`/api/barcode?code=${code}&menge=${menge}`);
    const data = await res.json();
    if (res.ok) {
      setPreviewData({
        name: data.name,
        kcal: data.Kalorien,
        eiweiss: data.Eiweiß,
        fett: data.Fett,
        kh: data.Kohlenhydrate,
      });
      setGramm("100");
      setEingabe("");
    } else {
      alert("❌ Produkt nicht gefunden");
    }
  };

  const handleTextSubmit = async () => {
    const res = await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: eingabe }),
    });
    const data = await res.json();

    if (res.ok) {
      setPreviewData({
        name: eingabe,
        kcal: Number(data.Kalorien),
        eiweiss: Number(data.Eiweiß),
        fett: Number(data.Fett),
        kh: Number(data.Kohlenhydrate),
      });
      setGramm("100");
      setEingabe("");
    } else {
      alert("❌ Fehler bei GPT");
    }
  };

  const handleSpeichern = async () => {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: previewData?.name,
        kcal: (previewData!.kcal / 100) * parseFloat(gramm),
        eiweiss: (previewData!.eiweiss / 100) * parseFloat(gramm),
        fett: (previewData!.fett / 100) * parseFloat(gramm),
        kh: (previewData!.kh / 100) * parseFloat(gramm),
      }),
    });

    if (res.ok) {
      setSaved(true);
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
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
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 999,
      paddingBottom: 40,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          backgroundColor: "#2a2a2a",
          color: "#fff",
          padding: 24,
          borderRadius: 16,
          width: "90%",
          maxWidth: 500,
          maxHeight: "90%",
          overflowY: "auto",
          boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
          position: "relative",
        }}
      >
        {/* ❌ Schließen-Button mit Mini-Sprung beim Hover */}
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.2, rotate: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
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
        </motion.button>

        <h2 style={{ marginTop: 0 }}>📝 Neue Eingabe</h2>

        <textarea
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder="Was hast du gegessen?"
          rows={3}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #555",
            backgroundColor: "#1e1e1e",
            color: "#fff",
          }}
        />

        {/* Vorschau Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleTextSubmit}
          style={{
            backgroundColor: "#36a2eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            marginBottom: 16,
            width: "100%",
          }}
        >
          ✅ Vorschau anzeigen
        </motion.button>

        {/* Menge kommt jetzt DARUNTER */}
        <label>Menge (z. B. 1, 0.5):</label>
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={menge}
          onChange={(e) => setMenge(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            fontSize: 16,
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #555",
            backgroundColor: "#1e1e1e",
            color: "#fff",
          }}
        />

        <button
          onClick={() => setScanning(true)}
          style={{
            backgroundColor: "#444",
            color: "#fff",
            border: "1px solid #666",
            borderRadius: 8,
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 16,
            width: "100%",
          }}
        >
          📷 Barcode scannen
        </button>

        {scanning && (
          <div style={{ marginBottom: 12 }}>
            <BarcodeScanner onDetected={handleBarcode} />
            <button onClick={() => setScanning(false)} style={{ marginTop: 8 }}>
              ❌ Abbrechen
            </button>
          </div>
        )}

        {previewData && (
          <div style={{ marginTop: 20 }}>
            <h3>Vorschau: {previewData.name}</h3>
            <label>Gramm / ml:</label>
            <input
              type="number"
              min="1"
              value={gramm}
              onChange={(e) => setGramm(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                marginBottom: 12,
                borderRadius: 8,
                border: "1px solid #555",
                backgroundColor: "#1e1e1e",
                color: "#fff",
              }}
            />

            <p>Kalorien: {((previewData.kcal / 100) * parseFloat(gramm)).toFixed(1)} kcal</p>
            <p>Eiweiß: {((previewData.eiweiss / 100) * parseFloat(gramm)).toFixed(1)} g</p>
            <p>Fett: {((previewData.fett / 100) * parseFloat(gramm)).toFixed(1)} g</p>
            <p>Kohlenhydrate: {((previewData.kh / 100) * parseFloat(gramm)).toFixed(1)} g</p>

            <motion.button
              onClick={handleSpeichern}
              whileHover={{ scale: 1.05 }}
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              style={{
                backgroundColor: "#3cb043",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 16,
                cursor: "pointer",
                marginTop: 10,
                marginRight: 8,
              }}
            >
              ✅ Eintragen
            </motion.button>

            <button onClick={onClose} style={{
              backgroundColor: "#444",
              color: "#fff",
              border: "1px solid #666",
              borderRadius: 8,
              padding: "10px 16px",
              fontSize: 16,
              cursor: "pointer",
              marginTop: 10,
            }}>
              ❌ Abbrechen
            </button>
          </div>
        )}

        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign: "center",
                color: "#90EE90",
                marginTop: 20,
                fontWeight: "bold",
              }}
            >
              ✅ Gespeichert!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
