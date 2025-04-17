import { useState } from "react";
import FloatingForm from "../components/FloatingForm";
import { GaugeChart } from "../components/charts/GaugeChart";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);

  // Dummy-Daten – später aus API holen
  const todayData = {
    kalorien: 1450,
    ziel: 2200,
    eiweiss: 80,
    eiweissZiel: 130,
    fett: 50,
    fettZiel: 70,
    kh: 160,
    khZiel: 250,
  };

  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif", position: "relative" }}>
      <h1>📊 Dein Dashboard</h1>

      {/* Gauge Charts */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <GaugeChart label="Kalorien" value={todayData.kalorien} max={todayData.ziel} color="#ff6384" />
        <GaugeChart label="Eiweiß" value={todayData.eiweiss} max={todayData.eiweissZiel} color="#36a2eb" />
        <GaugeChart label="Fett" value={todayData.fett} max={todayData.fettZiel} color="#ffcd56" />
        <GaugeChart label="Kohlenhydrate" value={todayData.kh} max={todayData.khZiel} color="#4bc0c0" />
      </div>

      {/* Line Chart – Tagesverlauf */}
      <div style={{ marginTop: 40 }}>
        <TagesLineChart />
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

      {/* Overlay-Form */}
      {showForm && <FloatingForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
