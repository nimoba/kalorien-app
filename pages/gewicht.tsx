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

  useEffect(() => {
    fetch("/api/weight-history")
      .then((res) => res.json())
      .then((data) => setData(data));
  }, []);

  if (!data) {
    return <p style={{ color: "#fff", textAlign: "center" }}>⏳ Lade Gewichtsdaten...</p>;
  }

  const { startgewicht, verlauf, theoretisch } = data;

  const labels = verlauf.map((e: any) => e.datum);
  const echteWerte = verlauf.map((e: any) => e.gewicht);
  const theoriewerte = theoretisch.map((e: any) => e.gewicht);

  const letzte = echteWerte[echteWerte.length - 1] || startgewicht;
  const diff = (letzte - startgewicht).toFixed(1);
  const farbe = parseFloat(diff) < 0 ? "#3cb043" : "#d62e79";

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
    ],
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

      <div style={{ marginTop: 32 }}>
        <Line data={chartData} options={options} />
      </div>

      <FloatingTabBar />
    </div>
  );
}
