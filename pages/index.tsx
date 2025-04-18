import { useState } from "react";
import { KalorienHalbkreis } from "../components/charts/KalorienHalbkreis";
import { MakroBalken } from "../components/charts/MakroBalken";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";
import FloatingForm from "../components/FloatingForm";

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
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        position: "relative",
        backgroundColor: "#2c2c2c", // 💡 Dark gray background
        minHeight: "100vh",
        color: "#ffffff" // optional: white text
      }}
    >

      <h1>📊 Dein Dashboard</h1>

      {/* Gauge Charts */}
      <KalorienHalbkreis gegessen={1000} ziel={2200} />

      <div style={{ marginTop: 40 }}>
        <MakroBalken label="Kohlenhydrate" value={390} ziel={451} farbe="#36a2eb" />
        <MakroBalken label="Eiweiß" value={69} ziel={180} farbe="#4bc0c0" />
        <MakroBalken label="Fett" value={47} ziel={119} farbe="#ffcd56" />
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
