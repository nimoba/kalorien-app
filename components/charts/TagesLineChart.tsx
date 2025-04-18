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
  LineController,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { getOvershootColor } from "../../utils/colors";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  LineController
);

export function TagesLineChart() {
  // Dummy-Daten – später via API dynamisch
  const stunden = [
    "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00",
  ];

  const intake = [0, 120, 350, 780, 900, 1050, 1300, 1450, 1450];
  const zielWert = 2200;
  const ziel = new Array(stunden.length).fill(zielWert);

  // Max-Wert prüfen für Farblogik
  const maxIntake = Math.max(...intake);
  const farbe = getOvershootColor(maxIntake, zielWert, "#36a2eb");

  const data: ChartData<"line"> = {
    labels: stunden,
    datasets: [
      {
        label: "Kalorienverlauf",
        data: intake,
        fill: true,
        borderColor: farbe,
        backgroundColor: farbe + "33", // leichte Transparenz
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

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
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