'use client';

import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useEffect, useState } from "react";
import { useZiele } from "../../hooks/useZiele"; // ⬅️ Import!


ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function KcalBilanzChart() {
  const [data, setData] = useState<any[]>([]);
  const ziele = useZiele();
  useEffect(() => {
    fetch("/api/kcal-history")
      .then((res) => res.json())
      .then((res) => setData(res));
  }, []);

  if (data.length === 0) return null;

  const labels = data.map((e) => e.datum);
  const gegessen = data.map((e) => e.kcalKumuliert);
  const verbraucht = labels.map((_, i) => (i + 1) * ziele.tdee!); // ⬅️ geschätzter kumulierter Verbrauch

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Gegessen (kumuliert)",
        data: gegessen,
        borderColor: "#8e44ad",
        backgroundColor: "#8e44ad33",
        tension: 0.25,
      },
      {
        label: "Verbrauch (geschätzt)",
        data: verbraucht,
        borderColor: "#36a2eb",
        borderDash: [4, 4],
        tension: 0.15,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div style={{ marginTop: 48 }}>
      <h3 style={{ marginBottom: 12 }}>📉 Kcal-Bilanz (Verbrauch vs. Realität)</h3>
      <Line data={chartData} options={options} />
    </div>
  );
}
