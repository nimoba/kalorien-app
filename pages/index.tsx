// pages/index.tsx
import { useState } from "react";

export default function Home() {
  const [eingabe, setEingabe] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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

      {status === "success" && <p>✅ Erfolgreich eingetragen!</p>}
      {status === "error" && <p>❌ Fehler beim Senden</p>}
    </div>
  );
}
