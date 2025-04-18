'use client';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);

interface Props {
  gegessen: number;
  ziel: number;
}

export function KalorienHalbkreis({ gegessen, ziel }: Props) {
  const rest = Math.max(ziel - gegessen, 0);

  const data = {
    labels: ["Gegessen", "Übrig"],
    datasets: [
      {
        data: [gegessen, rest],
        backgroundColor: ["#4bc0c0", "#e0e0e0"],
        borderWidth: 0,
        circumference: 180,
        rotation: -90,
      },
    ],
  };

  const options = {
    cutout: "70%",
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div style={{ width: 200, margin: "auto", textAlign: "center" }}>
      <Doughnut data={data} options={options} />
      <div style={{ marginTop: -110, fontSize: 22, fontWeight: "bold" }}>
        {gegessen} / {ziel} kcal
      </div>
    </div>
  );
}
