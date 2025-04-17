'use client';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend
);

export function TagesLineChart() {
  // Dummy-Daten – später via API dynamisch
  const stunden = [
    "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00",
  ];

  const intake = [0, 120, 350, 780, 900, 1050, 1300, 1450, 1450];
  const ziel = new Array(stunden.length).fill(2200); // gestrichelte Ziel-Linie

  const data = {
    labels: stunden,
    datasets: [
      {
        label: "Kalorienverlauf",
        data: intake,
        fill: true,
        borderColor: "#36a2eb",
        backgroundColor: "rgba(54,162,235,0.2)",
        tension: 0.3,
      },
      {
        label: "Tagesziel",
        data: ziel,
        borderDash: [6, 6],
        borderColor: "#ff6384",
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>⏰ Kalorien nach Uhrzeit</h3>
      <Line data={data} options={options} />
    </div>
  );
}
