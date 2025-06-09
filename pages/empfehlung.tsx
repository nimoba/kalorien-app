"use client";

import { useState } from "react";
import FloatingTabBar from "../components/FloatingTabBar";

interface Vorschlag {
  gericht: string;
  zutaten: string[];
  rezept: string;
  makros: {
    kcal: number;
    eiweiss: number;
    fett: number;
    kh: number;
  };
  preis?: string;
}

export default function EmpfehlungTab() {
  const [stil, setStil] = useState<"vegetarisch" | "alles">("alles");
  const [kalorienProzent, setKalorienProzent] = useState(100);
  const [essensarten, setEssensarten] = useState<string[]>([]);
  const [budget, setBudget] = useState(false);
  const [zeit, setZeit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [vorschlaege, setVorschlaege] = useState<Vorschlag[] | null>(null);
  const [wochenplan, setWochenplan] = useState(false);

  const toggleEssensart = (art: string) => {
    setEssensarten((prev) =>
      prev.includes(art) ? prev.filter((e) => e !== art) : [...prev, art]
    );
  };

  const laden = async () => {
    setLoading(true);
    setVorschlaege(null);

    const res = await fetch("/api/essensvorschlag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stil, kalorienProzent, essensarten, budget, zeit }),
    });

    const data = await res.json();
    setVorschlaege(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: 24, color: "#fff", background: "#2c2c2c", minHeight: "100vh", paddingBottom: "100px"}}>
      <h1>🍽️ Essensempfehlung</h1>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <input
            type="checkbox"
            checked={wochenplan}
            onChange={() => setWochenplan(!wochenplan)}
        />
        🗓️ Ganze Woche planen (Zutaten clever verteilen)
      </label>

      {/* Toggle Stil */}
      <div style={{ display: "flex", marginBottom: 16, background: "#444", borderRadius: 12 }}>
        <button
          onClick={() => setStil("alles")}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            backgroundColor: stil === "alles" ? "#36a2eb" : "transparent",
            color: stil === "alles" ? "#fff" : "#ccc",
            border: "none",
            cursor: "pointer",
          }}
        >
          Alles
        </button>
        <button
          onClick={() => setStil("vegetarisch")}
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            backgroundColor: stil === "vegetarisch" ? "#36a2eb" : "transparent",
            color: stil === "vegetarisch" ? "#fff" : "#ccc",
            border: "none",
            cursor: "pointer",
          }}
        >
          Vegetarisch
        </button>
      </div>

      <label>🔢 Wie viel deiner Kalorien willst du verwenden? ({kalorienProzent}%)</label>
      <input
        type="range"
        min={10}
        max={100}
        value={kalorienProzent}
        onChange={(e) => setKalorienProzent(Number(e.target.value))}
        style={{ width: "100%", marginBottom: 16 }}
      />

      <label>🍳 Für welche Mahlzeiten?</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {['Frühstück', 'Mittagessen', 'Abendessen', 'Snack'].map((art) => (
          <button
            key={art}
            onClick={() => toggleEssensart(art)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: essensarten.includes(art) ? "#36a2eb" : "#444",
              color: essensarten.includes(art) ? "#fff" : "#ccc",
              border: "none",
              cursor: "pointer",
            }}
          >
            {art}
          </button>
        ))}
      </div>

      <label>
        <input type="checkbox" checked={budget} onChange={(e) => setBudget(e.target.checked)} /> On a Budget 💸
      </label>

      <label style={{ display: "block", marginTop: 16 }}>⏱️ Zeitaufwand: {zeit} / 100</label>
      <input
        type="range"
        min={0}
        max={100}
        value={zeit}
        onChange={(e) => setZeit(Number(e.target.value))}
        style={{ width: "100%", marginBottom: 16 }}
      />

      <button
        onClick={laden}
        disabled={loading}
        style={{
          backgroundColor: "#3cb043",
          color: "#fff",
          border: "none",
          padding: "12px 20px",
          borderRadius: 8,
          fontSize: 16,
          cursor: "pointer",
          width: "100%",
        }}
      >
        🧠 Empfehlung generieren
      </button>

      {loading && <p style={{ marginTop: 16 }}>⏳ GPT denkt nach...</p>}

      {vorschlaege && (
        <div style={{ marginTop: 24 }}>
          {vorschlaege.map((v, i) => (
            <div key={i} style={{ background: "#1e1e1e", padding: 16, borderRadius: 12, marginBottom: 16 }}>
              <h3>{v.gericht}</h3>
              <p><strong>Zutaten:</strong> {v.zutaten.join(", ")}</p>
              <p><strong>Zubereitung:</strong> {v.rezept}</p>
              <p><strong>Makros:</strong> {v.makros.kcal} kcal, {v.makros.eiweiss}g Eiweiß, {v.makros.fett}g Fett, {v.makros.kh}g KH</p>
              {v.preis && <p><strong>Preis:</strong> {v.preis}</p>}
            </div>
          ))}
        </div>
      )}

      <FloatingTabBar />
    </div>
  );
}
