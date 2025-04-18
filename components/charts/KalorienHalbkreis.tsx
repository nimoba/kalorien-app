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

  const progress = Math.min(gegessen / ziel, 1); // Max 100%
  const winkel = (progress * 180); // 0-180°

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
  
      {/* Rotierender Trenner-Container */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -100%) rotate(${winkel + 270}deg)`,
          transformOrigin: "center 114px", // ggf. feintunen
          zIndex: 10,
        }}
      >
        {/* Wrapper für Strich + Dreieck */}
        <div
          style={{
            transform: "translateY(-32px)", // Strich & Dreieck gemeinsam nach außen
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >

          {/* Dreieck */}
          <div
            style={{
              position: "absolute",
              bottom: 36, // gleiche Höhe wie der Strich
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "10px solid #4da3ee", // gleiche Farbe wie Strich
              zIndex: 5,
            }}
          />
          {/* Strich */}
          <div
            style={{
              width: 4,
              height: 39,
              backgroundColor: "#4da3ee",
            }}
          />
        </div>
      </div>


    </div>
  );
  

}
