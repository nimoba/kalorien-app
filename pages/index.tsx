// pages/index.tsx
import { useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner"; // 👈 dein Component


export default function Home() {
  const [menge, setMenge] = useState("1");
  const [eingabe, setEingabe] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(""); // ⬅️ für Fehleranzeige

  const handleBarcode = async (code: string) => {
    try {
      const res = await fetch(`/api/barcode?code=${code}&menge=${menge}`);
      const data = await res.json();
  
      if (res.ok) {
        alert(`✅ Eingetragen: ${data.name} (${menge}x)`);
        setEingabe("");
      } else {
        alert("❌ Produkt nicht gefunden");
      }
    } catch (err) {
      alert("⚠️ Fehler beim Scannen");
    } finally {
      setScanning(false);
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
            onError={(err) => setScanError("❌ Kein gültiger Barcode erkannt")}
          />


          <button onClick={() => setScanning(false)} style={{ marginTop: 10 }}>
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
