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
import { motion } from "framer-motion";
import { getProgressColor, getStatusInfo } from "../../utils/colors";
import { useEffect, useState } from "react";

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

interface Props {
  refresh?: number;
}

interface HistoryEntry {
  datum: string;
  kalorien: number;
  ziel: number;
}

export function WochenChart({ refresh }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [refresh]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(28, 28, 38, 0.6)',
          borderRadius: 20,
          padding: 20,
          marginTop: 20,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: 12 }} />
      </motion.div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(28, 28, 38, 0.6)',
          borderRadius: 20,
          padding: 20,
          marginTop: 20,
          border: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <p style={{ color: "#71717a", margin: 0, textAlign: 'center' }}>Keine Verlaufsdaten verfügbar</p>
      </motion.div>
    );
  }

  const labels = history.map((e) => e.datum);
  const daten = history.map((e) => e.kalorien);
  const ziele = history.map((e) => e.ziel);
  const barColors = daten.map((val, i) => getProgressColor(val / ziele[i]));

  const durchschnittsProzent = history.reduce((sum, entry) => {
    return sum + (entry.kalorien / entry.ziel);
  }, 0) / history.length;

  const statusInfo = getStatusInfo(durchschnittsProzent);
  const avgCalories = Math.round(daten.reduce((a, b) => a + b, 0) / daten.length);

  const data: ChartData<"bar" | "line"> = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Kalorien",
        data: daten,
        backgroundColor: barColors.map(c => c + '80'),
        borderColor: barColors,
        borderWidth: 1,
        borderRadius: 6,
      },
      {
        type: "line",
        label: "Tagesziel",
        data: ziele,
        borderColor: "rgba(239, 68, 68, 0.6)",
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: '#71717a',
          font: { size: 11, family: 'Inter, sans-serif' },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 38, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: '#52525b', font: { size: 10, family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#52525b', font: { size: 10, family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { display: false },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        background: 'rgba(28, 28, 38, 0.6)',
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
        border: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
      }}>
        <div>
          <h3 style={{
            margin: 0,
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}>
            Monatsverlauf
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 12,
            color: '#71717a',
          }}>
            Kalorien der letzten Tage
          </p>
        </div>
        <div style={{
          background: `${statusInfo.color}15`,
          padding: '5px 10px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: statusInfo.color,
          }} />
          <span style={{
            fontSize: 11,
            color: statusInfo.color,
            fontWeight: 600,
          }}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginBottom: 16,
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: '10px 16px',
          flex: 1,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {Math.round(durchschnittsProzent * 100)}%
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Zielerreichung</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: '10px 16px',
          flex: 1,
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {avgCalories}
          </div>
          <div style={{ fontSize: 11, color: '#71717a', marginTop: 2 }}>Durchschnitt</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '240px' }}>
        <Chart type="bar" data={data} options={options} />
      </div>
    </motion.div>
  );
}
