'use client';

import { useState, useEffect } from "react";
import { KalorienHalbkreis } from "../components/charts/KalorienHalbkreis";
import { MakroBalken } from "../components/charts/MakroBalken";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";
import FloatingForm from "../components/FloatingForm";
import SettingsForm from "../components/SettingsForm";
import { useZiele } from "../hooks/useZiele";
import FloatingActionMenu from "../components/FloatingActionMenu";
import GewichtForm from "../components/GewichtForm";
import FloatingTabBar from "../components/FloatingTabBar";
import KcalBilanzChart from "../components/charts/KcalBilanzChart";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [daten, setDaten] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshZiele, setRefreshZiele] = useState(0);
  const ziele = useZiele(refreshZiele);
  const [showWeight, setShowWeight] = useState(false);

  const loadDaten = () => {
    fetch("/api/overview")
      .then((res) => res.json())
      .then((data) => {
        setDaten(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDaten();
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
      <KalorienHalbkreis gegessen={daten.kalorien} ziel={ziele.zielKcal} />

      {/* Makro-Balken */}
      <div style={{ marginTop: 40 }}>
        <MakroBalken label="Kohlenhydrate" value={daten.kh} ziel={ziele.zielKh} farbe="#36a2eb" />
        <MakroBalken label="Eiweiß" value={daten.eiweiss} ziel={ziele.zielEiweiss} farbe="#4bc0c0" />
        <MakroBalken label="Fett" value={daten.fett} ziel={ziele.zielFett} farbe="#ffcd56" />
      </div>

      {/* Tagesverlauf */}
      <div style={{ marginTop: 40 }}>
        <TagesLineChart eintraege={daten.eintraege} ziel={ziele.zielKcal} />
      </div>

      {/* Monatsverlauf */}
      <div style={{ marginTop: 40 }}>
        <WochenChart />
      </div>
      <div style={{ marginTop: 40 }}>
        <KcalBilanzChart />
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onOpenForm={() => setShowForm(true)}
        onOpenWeight={() => setShowWeight(true)}
        onOpenSettings={() => setShowSettings(true)}
      />


      {/* Eingabeformular */}
      {showForm && (
        <FloatingForm
          onClose={() => setShowForm(false)}
          onRefresh={loadDaten}
        />
      )}

      {/* Einstellungen */}
      {showSettings && (
        <SettingsForm
          onClose={() => {
            setShowSettings(false);
            loadDaten();
            setRefreshZiele((v) => v + 1); // 🆕 zwingt den Hook zum Neuladen
          }}
        />
      
      )}

      {showWeight && (
        <GewichtForm
          onClose={() => setShowWeight(false)}
          onRefresh={() => {}} // falls du irgendwann etwas reloaden willst
        />
      )}

      {!showForm && !showSettings && !showWeight && <FloatingTabBar />}
    </div>
  );
}
