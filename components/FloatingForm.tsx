'use client';

import { useState } from "react";
import BarcodeScanner from "./BarcodeScanner";

interface Props {
  onClose: () => void;
}

export default function FloatingForm({ onClose }: Props) {
  const [eingabe, setEingabe] = useState("");
  const [menge, setMenge] = useState("1");
  const [scanning, setScanning] = useState(false);
  const [previewData, setPreviewData] = useState<null | {
    name: string;
    kcal: number;
    eiweiss: number;
    fett: number;
    kh: number;
  }>(null);
  const [gramm, setGramm] = useState("100");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");

  const handleBarcode = async (code: string) => {
    setStatus("loading");
    setScanning(false);
    try {
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
        setStatus("idle");
      } else {
        alert("❌ Produkt nicht gefunden");
      }
    } catch (err) {
      alert("⚠️ Fehler beim Barcode-Scan");
    }
  };

  const handleTextSubmit = async () => {
    setStatus("loading");
    try {
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
        setStatus("idle");
      } else {
        alert("❌ Fehler bei GPT");
        setStatus("error");
      }
    } catch (err) {
      alert("⚠️ Fehler bei GPT");
      setStatus("error");
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
      alert("✅ Gespeichert!");
      setPreviewData(null);
      setGramm("100");
      setStatus("success");
      onClose();
    } else {
      alert("❌ Fehler beim Speichern");
      setStatus("error");
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
      <div style={{
        background: "#fff",
        padding: 24,
        borderRadius: 12,
        width: "90%",
        maxWidth: 500,
        maxHeight: "90%",
        overflowY: "auto",
        boxShadow: "0 5px 20px rgba(0,0,0,0.2)"
      }}>
        <h2 style={{ marginTop: 0 }}>📝 Neue Eingabe</h2>

        <textarea
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder="Was hast du gegessen?"
          rows={3}
          style={{ width: "100%", padding: 12, fontSize: 16, marginBottom: 12 }}
        />

        <button onClick={handleTextSubmit} style={{ marginBottom: 16 }}>
          ✅ Vorschau anzeigen
        </button>

        <div>
          <label>Menge (z. B. 1, 0.5):</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={menge}
            onChange={(e) => setMenge(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
        </div>

        <button onClick={() => setScanning(true)} style={{ marginBottom: 16 }}>
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
              style={{ width: "100%", padding: 8, marginBottom: 12 }}
            />
            <p>Kalorien: {((previewData.kcal / 100) * parseFloat(gramm)).toFixed(1)} kcal</p>
            <p>Eiweiß: {((previewData.eiweiss / 100) * parseFloat(gramm)).toFixed(1)} g</p>
            <p>Fett: {((previewData.fett / 100) * parseFloat(gramm)).toFixed(1)} g</p>
            <p>Kohlenhydrate: {((previewData.kh / 100) * parseFloat(gramm)).toFixed(1)} g</p>

            <button onClick={handleSpeichern} style={{ marginTop: 10 }}>✅ Eintragen</button>
            <button onClick={onClose} style={{ marginTop: 10, marginLeft: 10 }}>❌ Abbrechen</button>
          </div>
        )}
      </div>
    </div>
  );
}
