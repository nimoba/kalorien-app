'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController
);


interface Props {
  label: string;
  value: number;
  max: number;
  color: string;
}

export function GaugeChart({ label, value, max, color }: Props) {
  const clamped = Math.min(value, max); // nicht über 100% hinaus
  const rest = Math.max(max - clamped, 0);

  const data = {
    labels: [label, "Rest"],
    datasets: [
      {
        data: [clamped, rest],
        backgroundColor: [color, "#e0e0e0"],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "75%",
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div style={{ width: 150, textAlign: "center" }}>
      <Doughnut data={data} options={options} />
      <p style={{ marginTop: -70, fontSize: 18, fontWeight: "bold" }}>
        {Math.round((value / max) * 100)}%
      </p>
      <p style={{ marginTop: 8 }}>{label}</p>
    </div>
  );
}
