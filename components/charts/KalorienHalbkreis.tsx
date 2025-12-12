'use client';

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
} from "chart.js";
import { motion } from "framer-motion";
import { getProgressColor, getStatusInfo } from "../../utils/colors";

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);

interface Props {
  gegessen: number;
  ziel: number;
}

export function KalorienHalbkreis({ gegessen, ziel }: Props) {
  const rest = Math.max(ziel - gegessen, 0);
  const pct = gegessen / ziel;
  const statusInfo = getStatusInfo(pct);
  const remaining = ziel - gegessen;

  const data = {
    labels: ["Gegessen", "Übrig"],
    datasets: [
      {
        data: [gegessen, rest],
        backgroundColor: [getProgressColor(pct), "rgba(255, 255, 255, 0.05)"],
        borderWidth: 0,
        circumference: 180,
        rotation: -90,
        borderRadius: 8,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    cutout: "78%",
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 38, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(145deg, rgba(28, 28, 38, 0.9) 0%, rgba(22, 22, 29, 0.9) 100%)',
        borderRadius: 20,
        padding: 24,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle gradient glow based on status */}
      <div
        style={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          background: `radial-gradient(circle, ${statusInfo.color}20 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
        zIndex: 1,
      }}>
        <div>
          <h3 style={{
            color: '#fff',
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            Kalorien
          </h3>
          <p style={{
            color: '#71717a',
            margin: '4px 0 0 0',
            fontSize: 13,
          }}>
            Heute
          </p>
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: `${statusInfo.color}15`,
            padding: '6px 12px',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusInfo.color,
            boxShadow: `0 0 8px ${statusInfo.color}80`,
          }} />
          <span style={{
            fontSize: 12,
            color: statusInfo.color,
            fontWeight: 600,
          }}>
            {statusInfo.text}
          </span>
        </motion.div>
      </div>

      {/* Chart Container */}
      <div style={{
        width: "100%",
        maxWidth: 280,
        aspectRatio: "2 / 1",
        margin: "0 auto",
        position: "relative",
      }}>
        <Doughnut data={data} options={options} />

        {/* Center content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            position: "absolute",
            top: "60%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 2,
          }}
        >
          <div style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: '-0.03em',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {gegessen.toLocaleString()}
          </div>
          <div style={{
            fontSize: 13,
            color: '#71717a',
            marginTop: 4,
          }}>
            / {ziel.toLocaleString()} kcal
          </div>
        </motion.div>
      </div>

      {/* Bottom stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 32,
        marginTop: 20,
        paddingTop: 20,
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 22,
            fontWeight: 600,
            color: remaining >= 0 ? '#10b981' : '#ef4444',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {remaining >= 0 ? remaining.toLocaleString() : `+${Math.abs(remaining).toLocaleString()}`}
          </div>
          <div style={{
            fontSize: 12,
            color: '#71717a',
            marginTop: 2,
          }}>
            {remaining >= 0 ? 'Übrig' : 'Über'}
          </div>
        </div>
        <div style={{
          width: 1,
          height: 40,
          background: 'rgba(255, 255, 255, 0.06)',
        }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {Math.round(pct * 100)}%
          </div>
          <div style={{
            fontSize: 12,
            color: '#71717a',
            marginTop: 2,
          }}>
            Erreicht
          </div>
        </div>
      </div>
    </motion.div>
  );
}
