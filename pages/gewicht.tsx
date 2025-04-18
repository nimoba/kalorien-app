'use client';

import { useEffect, useState } from "react";
import FloatingTabBar from "../components/FloatingTabBar";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function GewichtSeite() {
  const [data, setData] = useState<any>(null);
  const [analyse, setAnalyse] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/weight-history")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  const handleAnalyse = async () => {
    const res = await fetch("/api/analyse", { method: "POST" });
    const d = await res.json();
    setAnalyse(d.analyse || "Keine Analyse verfügbar");
  };

  if (!data) {
    return <p style={{ color: "#fff", textAlign: "center" }}>⏳ Lade Gewichtsdaten...</p>;
  }

  const {
    startgewicht,
    verlauf,
    theoretisch,
    geglättet,
    trend,
    fett,
    muskel,
    zielGewicht
  } = data;

  const labels = verlauf.map((e: any) => e.datum);
  const echteWerte = verlauf.map((e: any) => e.gewicht);
  const theoriewerte = theoretisch.map((e: any) => e.gewicht);
  const smoothed = geglättet.map((e: any) => e.gewicht);
  const trendlinie = trend.map((e: any) => e.gewicht);

  const letzte = echteWerte[echteWerte.length - 1] || startgewicht;
  const diff = (letzte - startgewicht).toFixed(1);
  const farbe = parseFloat(diff) < 0 ? "#3cb043" : "#d62e79";

  // 📅 Zielreichweite
  const letzteTheorie = theoriewerte[theoriewerte.length - 1] || startgewicht;
  const deltaTheorie = startgewicht - letzteTheorie;
  const gesamtDefizit = deltaTheorie * 7700;
  const tage = theoriewerte.length;
  const defizitØ = gesamtDefizit / tage;

  const restGewicht = letzte - zielGewicht;
  const tageBisZiel = zielGewicht && defizitØ > 0
    ? (restGewicht * 7700) / defizitØ
    : null;

  const chartData = {
    labels,
    datasets: [
      {
        label: "Tatsächliches Gewicht",
        data: echteWerte,
        borderColor: "#36a2eb",
        backgroundColor: "#36a2eb33",
        tension: 0.3,
      },
      {
        label: "Theoretisch (Kcal-basiert)",
        data: theoriewerte,
        borderColor: "#ff6384",
        borderDash: [5, 5],
        pointRadius: 0,
        tension: 0.2,
      },
      {
        label: "7-Tage Ø",
        data: smoothed,
        borderColor: "#f4d35e",
        borderWidth: 1,
        pointRadius: 0,
        tension: 0.25,
      },
      {
        label: "Trendlinie",
        data: trendlinie,
        borderColor: "#d62e79",
        borderDash: [2, 4],
        pointRadius: 0,
        borderWidth: 2,
        tension: 0,
      },
      zielGewicht && {
        label: "Zielgewicht",
        data: new Array(labels.length).fill(zielGewicht),
        borderColor: "#ffffffaa",
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [2, 2],
        tension: 0,
      }
    ].filter(Boolean), // remove false/null entries
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" as const },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#2c2c2c",
        minHeight: "100vh",
        color: "#fff",
      }}
    >
      <h1>📉 Gewicht</h1>

      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ color: farbe }}
      >
        {parseFloat(diff) < 0
          ? `${Math.abs(parseFloat(diff))} kg abgenommen 💪`
          : `${Math.abs(parseFloat(diff))} kg zugenommen 🤷‍♂️`}
      </motion.h2>

      {tageBisZiel && (
        <motion.p
          style={{ fontStyle: "italic", marginTop: 4, color: "#aaa" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          🏁 Wenn du so weitermachst, erreichst du dein Ziel in {Math.round(tageBisZiel)} Tagen
        </motion.p>
      )}

      <button
        onClick={handleAnalyse}
        style={{
          backgroundColor: "#444",
          border: "none",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        📊 GPT-Analyse anzeigen
      </button>

      {analyse && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            backgroundColor: "#1e1e1e",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            fontSize: 14,
            color: "#ccc",
          }}
        >
          {analyse}
        </motion.div>
      )}

      <div style={{ marginTop: 32 }}>
        <Line data={chartData} options={options} />
      </div>

      <div style={{ marginTop: 50 }}>
        <h2>🧬 Körperzusammensetzung</h2>

        <Line
          data={{
            labels: verlauf.map((e: any) => e.datum),
            datasets: [
              {
                label: "Körperfett (%)",
                data: fett.map((e: any) => e.wert),
                borderColor: "#ffa600",
                backgroundColor: "#ffa60033",
                tension: 0.25,
              },
              {
                label: "Muskelmasse (%)",
                data: muskel.map((e: any) => e.wert),
                borderColor: "#00cc99",
                backgroundColor: "#00cc9933",
                tension: 0.25,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { position: "bottom" } },
            scales: {
              y: { beginAtZero: false },
            },
          }}
        />
      </div>

      <FloatingTabBar />
    </div>
  );
}
