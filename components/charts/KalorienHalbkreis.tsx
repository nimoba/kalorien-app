'use client';

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
import { getProgressColor } from "../../utils/colors";

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
        backgroundColor: [getProgressColor(gegessen / ziel), "#e0e0e0"],
        borderWidth: 0,
        circumference: 180,
        rotation: -90,
        borderRadius: 10, // 👈 sorgt für runde Enden!
        hoverOffset: 4, // für mehr optisches Feedback
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
    <div style={{
      width: "100%",
      maxWidth: 300,
      aspectRatio: "2 / 1",
      margin: "auto",
      textAlign: "center",
      position: "relative"
    }}>
      <Doughnut data={data} options={options} />

      <div style={{
        position: "absolute",
        top: "70%",
        left: "50%",
        transform: "translate(-50%, -60%)",
        fontSize: 22,
        fontWeight: "bold"
      }}>
        {gegessen} / {ziel} kcal
      </div>
    </div>
  );
}