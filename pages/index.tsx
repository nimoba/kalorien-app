// pages/index.tsx
import { useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner"; // 👈 dein Component


export default function Home() {
  const [menge, setMenge] = useState("1");
  const [eingabe, setEingabe] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(""); // ⬅️ für Fehleranzeige
  const [previewData, setPreviewData] = useState<null | {
    name: string;
    kcal: number;
    eiweiss: number;
    fett: number;
    kh: number;
  }> (null);
  const [gramm, setGramm] = useState("100"); // standardmäßig 100g
  

  const handleBarcode = async (code: string) => {
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
      } else {
        console.warn("❌ Barcode-API Fehler:", res.status, data);
        alert(`❌ Produkt nicht gefunden oder Fehler bei API (${res.status})`);
      }
    } catch (err) {
      console.error("⚠️ Fehler beim Barcode-API-Aufruf:", err);
      alert("⚠️ Fehler beim Senden des Barcodes");
    } finally {
      setScanning(false);
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
      alert("✅ Eingetragen");
      setPreviewData(null);
      setGramm("100");
    } else {
      alert("❌ Fehler beim Speichern");
    }
  };
  
  
  

  async function senden() {
    setStatus("loading");
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: eingabe }),
      });
      if (res.ok) {
        setEingabe("");
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>🍽 Kalorien Tracker</h1>
  
      <textarea
        value={eingabe}
        onChange={(e) => setEingabe(e.target.value)}
        placeholder="Was hast du gegessen?"
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12 }}
      />
  
      <button onClick={senden} disabled={status === "loading"} style={{ marginTop: 12, padding: "10px 20px" }}>
        {status === "loading" ? "Sende..." : "✅ Eintragen"}
      </button>
  
      <button onClick={() => setScanning(true)} style={{ marginTop: 12, padding: "10px 20px" }}>
        📷 Barcode scannen
      </button>
  
      {scanning && (
        <div style={{ marginTop: 20 }}>
          <h3>📸 Scanne deinen Barcode</h3>
  
          <label style={{ display: "block", marginBottom: 4 }}>Menge (z. B. 1, 0.5):</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={menge}
            onChange={(e) => setMenge(e.target.value)}
            placeholder="Menge"
            style={{ padding: "8px", width: "100%", fontSize: 16, marginBottom: 12 }}
          />
  
          <BarcodeScanner
            onDetected={handleBarcode}
            onError={(err) => {
              if (!scanError) {
                setScanError("❌ Kein gültiger Barcode erkannt. Bitte neu ausrichten oder Abstand ändern.");
              }
            }}
          />
  
          <button onClick={() => {
            setScanning(false);
            setScanError("");
          }} style={{ marginTop: 10 }}>
            ❌ Abbrechen
          </button>
        </div>
      )}
  
      {previewData && (
        <div style={{ marginTop: 20, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <h3>📝 Vorschau: {previewData.name}</h3>
  
          <label>Menge in Gramm / ml:</label>
          <input
            type="number"
            min="1"
            value={gramm}
            onChange={(e) => setGramm(e.target.value)}
            style={{ width: "100%", padding: 8, marginTop: 4, marginBottom: 12 }}
          />
  
          <p>💥 Kalorien: {((previewData.kcal / 100) * parseFloat(gramm || "0")).toFixed(1)} kcal</p>
          <p>🍗 Eiweiß: {((previewData.eiweiss / 100) * parseFloat(gramm || "0")).toFixed(1)} g</p>
          <p>🥑 Fett: {((previewData.fett / 100) * parseFloat(gramm || "0")).toFixed(1)} g</p>
          <p>🍞 Kohlenhydrate: {((previewData.kh / 100) * parseFloat(gramm || "0")).toFixed(1)} g</p>
  
          <button onClick={handleSpeichern} style={{ marginTop: 10 }}>
            ✅ Eintragen
          </button>
          <button onClick={() => setPreviewData(null)} style={{ marginTop: 10, marginLeft: 10 }}>
            ❌ Abbrechen
          </button>
        </div>
      )}
  
      {status === "success" && <p>✅ Erfolgreich eingetragen!</p>}
      {status === "error" && <p>❌ Fehler beim Senden</p>}
      {scanError && (
        <p style={{ color: "red", marginTop: 10 }}>{scanError}</p>
      )}
    </div>
  );
  
}
