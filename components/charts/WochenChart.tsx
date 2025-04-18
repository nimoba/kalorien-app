'use client';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarController,
  LineController,
} from "chart.js";

import { Chart } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { getOvershootColor } from "../../utils/colors"; // 👈 make sure this is created

// Register everything needed for mixed chart
ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarController,
  LineController
);

export function WochenChart() {
  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const daten = [1800, 2000, 2200, 2100, 1900, 2300, 2150];
  const ziel = 2200;

  // 🟢 Bar colors: only red if value > 110% of goal
  const barColors = daten.map((val) => getOvershootColor(val, ziel, "#36a2eb"));

  const data: ChartData<"bar" | "line"> = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Kalorien",
        data: daten,
        backgroundColor: barColors,
        borderRadius: 6,
      },
      {
        type: "line",
        label: "Ziel",
        data: new Array(labels.length).fill(ziel),
        borderColor: "#ff6384",
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
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
      <h3 style={{ marginBottom: 12 }}>📆 Kalorien im Wochenverlauf</h3>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}
