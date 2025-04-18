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

interface Props {
  eintraege: { zeit: string; kcal: number }[];
  ziel: number;
}

export function TagesLineChart({ eintraege, ziel }: Props) {
  const labels = eintraege.map((e) => e.zeit);
  const werte = eintraege.map((e) => e.kcal);
  const zielArray = new Array(labels.length).fill(ziel);

  const maxKcal = Math.max(...werte);
  const farbe = getOvershootColor(maxKcal, ziel, "#36a2eb");

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Kalorienverlauf",
        data: werte,
        fill: true,
        borderColor: farbe,
        backgroundColor: farbe + "33",
        tension: 0.3,
      },
      {
        label: "Tagesziel",
        data: zielArray,
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
