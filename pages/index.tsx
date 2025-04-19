'use client';

import { useState, useEffect } from "react";
import { KalorienHalbkreis } from "../components/charts/KalorienHalbkreis";
import { MakroBalken } from "../components/charts/MakroBalken";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";
import FloatingForm from "../components/FloatingForm";
import SettingsForm from "../components/SettingsForm";
import FloatingActionMenu from "../components/FloatingActionMenu";
import GewichtForm from "../components/GewichtForm";
import FloatingTabBar from "../components/FloatingTabBar";
import KcalBilanzChart from "../components/charts/KcalBilanzChart";
import SportForm from "../components/SportForm";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [daten, setDaten] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWeight, setShowWeight] = useState(false);
  const [showSport, setShowSport] = useState(false);

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
        paddingBottom: "100px",
      }}
    >
      <h1>📊 Dein Dashboard</h1>

      {/* Kalorien Halbkreis */}
      <KalorienHalbkreis gegessen={daten.kalorien} ziel={daten.ziel} />

      {/* Makro-Balken */}
      <div style={{ marginTop: 40 }}>
        <MakroBalken label="Kohlenhydrate" value={daten.kh} ziel={daten.zielKh} farbe="#36a2eb" />
        <MakroBalken label="Eiweiß" value={daten.eiweiss} ziel={daten.zielEiweiss} farbe="#4bc0c0" />
        <MakroBalken label="Fett" value={daten.fett} ziel={daten.zielFett} farbe="#ffcd56" />
      </div>

      {/* Tagesverlauf */}
      <div style={{ marginTop: 40 }}>
        <TagesLineChart eintraege={daten.eintraege} ziel={daten.ziel} />
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
        onOpenSport={() => setShowSport(true)}
      />

      {showForm && (
        <FloatingForm
          onClose={() => setShowForm(false)}
          onRefresh={loadDaten}
        />
      )}

      {showSettings && (
        <SettingsForm
          onClose={() => {
            setShowSettings(false);
            loadDaten();
          }}
        />
      )}

      {showSport && (
        <SportForm
          onClose={() => setShowSport(false)}
          onRefresh={loadDaten}
        />
      )}

      {showWeight && (
        <GewichtForm
          onClose={() => setShowWeight(false)}
          onRefresh={() => {}} // optional
        />
      )}

      {!showForm && !showSettings && !showWeight && <FloatingTabBar />}
    </div>
  );
}
