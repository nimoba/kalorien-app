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
        borderRadius: 10,
        hoverOffset: 4,
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

      {/* Text zentriert */}
      <div style={{
        position: "absolute",
        top: "70%",
        left: "50%",
        transform: "translate(-50%, -60%)",
        fontSize: 22,
        fontWeight: "bold",
        zIndex: 2,
      }}>
        {gegessen} / {ziel} kcal
      </div>

      {/* Trennlinie – kurz, oben */}
      <div style={{
        position: "absolute",
        top: "8%",
        left: "50%",
        width: 2,
        height: "25%",
        backgroundColor: "#1e1e1e", // an deinen Hintergrund anpassen
        transform: "translateX(-50%)",
        zIndex: 3,
      }} />

      {/* Dreieck – Spitze nach unten */}
      <div style={{
        position: "absolute",
        top: "5%",
        left: "50%",
        transform: "translateX(-50%) rotate(180deg)",
        width: 0,
        height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderBottom: "10px solid #1e1e1e", // gleiche Farbe wie Hintergrund
        zIndex: 4,
      }} />
    </div>
  );
}
