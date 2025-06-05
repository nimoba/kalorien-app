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
  const progress = Math.min(gegessen / ziel, 1);
  const winkel = (progress * 180);

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
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#444',
        borderWidth: 1,
      },
    },
  };

  // Bewertung basierend auf Fortschritt
  const bewertung = () => {
    const prozent = gegessen / ziel;
    if (prozent >= 0.9 && prozent <= 1.1) return { farbe: '#27ae60', text: 'Perfect! 🎯' };      // 90-110%
    if (prozent >= 0.7 && prozent < 0.9) return { farbe: '#2ecc71', text: 'Sehr gut! 💪' };     // 70-90%
    if (prozent >= 0.5 && prozent < 0.7) return { farbe: '#f39c12', text: 'Ok 👍' };            // 50-70%
    if (prozent < 0.5) return { farbe: '#e74c3c', text: 'Zu wenig! ⚠️' };                      // <50%
    return { farbe: '#e74c3c', text: 'Zu viel! ⚠️' };                                          // >110%
  };

  const bewertungInfo = bewertung();

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      borderRadius: 12,
      padding: 24,
      border: `2px solid ${bewertungInfo.farbe}33`,
      marginBottom: 24,
    }}>
      {/* Content */}
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h3 style={{
            color: '#fff',
            margin: 0,
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            🍽️ Kalorien heute
          </h3>
          <span style={{
            fontSize: 12,
            color: bewertungInfo.farbe,
            fontWeight: 'bold'
          }}>
            {bewertungInfo.text}
          </span>
        </div>

        {/* Chart Container */}
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
            color: "#fff",
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
              transformOrigin: "center 114px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                transform: "translateY(-32px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  bottom: 36,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "10px solid #4da3ee",
                  zIndex: 5,
                }}
              />
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
      </div>
    </div>
  );
}