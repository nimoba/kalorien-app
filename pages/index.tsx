'use client';

import { useState, useEffect } from "react";
import { KalorienHalbkreis } from "../components/charts/KalorienHalbkreis";
import { MakroBalken } from "../components/charts/MakroBalken";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";
import FloatingForm from "../components/FloatingForm";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [daten, setDaten] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/overview")
      .then((res) => res.json())
      .then((data) => {
        setDaten(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <p style={{ color: "#fff", textAlign: "center" }}>⏳ Lade Tagesdaten...</p>;
  }

  if (!daten) {
    return <p style={{ color: "#fff", textAlign: "center" }}>❌ Fehler beim Laden der Daten.</p>;
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        position: "relative",
        backgroundColor: "#2c2c2c",
        minHeight: "100vh",
        color: "#ffffff",
      }}
    >
      <h1>📊 Dein Dashboard</h1>

      {/* Kalorien Halbkreis */}
      <KalorienHalbkreis gegessen={daten.kalorien} ziel={daten.ziel} />

      {/* Makro-Balken */}
      <div style={{ marginTop: 40 }}>
        <MakroBalken label="Kohlenhydrate" value={daten.kh} ziel={250} farbe="#36a2eb" />
        <MakroBalken label="Eiweiß" value={daten.eiweiss} ziel={130} farbe="#4bc0c0" />
        <MakroBalken label="Fett" value={daten.fett} ziel={70} farbe="#ffcd56" />
      </div>

      {/* Tagesverlauf */}
      <div style={{ marginTop: 40 }}>
        <TagesLineChart eintraege={daten.eintraege} ziel={daten.ziel} />
      </div>

      {/* Wochenverlauf */}
      <div style={{ marginTop: 40 }}>
        <WochenChart />
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: 30,
          right: 30,
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: "#36a2eb",
          color: "#fff",
          fontSize: 30,
          border: "none",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
          cursor: "pointer",
        }}
      >
        +
      </button>

      {showForm && <FloatingForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
