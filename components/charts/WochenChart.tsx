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
import { getOvershootColor } from "../../utils/colors";
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
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }}>
        <p style={{ color: "#fff", margin: 0 }}>⏳ Lade Monatsverlauf...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }}>
        <p style={{ color: "#fff", margin: 0 }}>Keine Verlaufsdaten verfügbar</p>
      </div>
    );
  }

  const labels = history.map((e) => e.datum);
  const daten = history.map((e) => e.kalorien);
  const ziele = history.map((e) => e.ziel);
  const barColors = daten.map((val, i) =>
    getOvershootColor(val, ziele[i], "#36a2eb")
  );

  // Durchschnittliche Zielerreichung berechnen
  const durchschnittsProzent = history.reduce((sum, entry) => {
    return sum + (entry.kalorien / entry.ziel);
  }, 0) / history.length;

  const bewertung = () => {
    if (durchschnittsProzent >= 0.95 && durchschnittsProzent <= 1.05) 
      return { farbe: '#27ae60', text: 'Excellent! 🎯' };
    if (durchschnittsProzent >= 0.85 && durchschnittsProzent <= 1.15) 
      return { farbe: '#2ecc71', text: 'Sehr gut! 💪' };
    if (durchschnittsProzent >= 0.7 && durchschnittsProzent <= 1.3) 
      return { farbe: '#f39c12', text: 'Ok 👍' };
    return { farbe: '#e74c3c', text: 'Verbesserung möglich ⚠️' };
  };

  const bewertungInfo = bewertung();

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
        label: "Tagesziel",
        data: ziele,
        borderColor: "#ff6384",
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 2,
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
          color: '#fff',
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#1e1e1e',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#444',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#ccc', font: { size: 11 } },
        grid: { color: '#333' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#ccc', font: { size: 11 } },
        grid: { color: '#333' },
      },
    },
  };

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      borderRadius: 12,
      padding: 20,
      marginTop: 24,
      border: `2px solid ${bewertungInfo.farbe}33`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Hintergrund-Effekt */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: `${Math.min(durchschnittsProzent * 100, 100)}%`,
        backgroundColor: `${bewertungInfo.farbe}11`,
        borderRadius: '12px 0 0 12px',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h3 style={{ 
            marginBottom: 0, 
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            📆 Kalorien im Monatsverlauf
          </h3>
          <span style={{
            fontSize: 12,
            color: bewertungInfo.farbe,
            fontWeight: 'bold'
          }}>
            {bewertungInfo.text}
          </span>
        </div>

        {/* Stats */}
        <div style={{
          marginBottom: 16,
          fontSize: 14,
          color: '#ccc'
        }}>
          Ø Zielerreichung: {(durchschnittsProzent * 100).toFixed(1)}%
        </div>

        {/* Chart */}
        <div style={{ height: '300px' }}>
          <Chart type="bar" data={data} options={options} />
        </div>
      </div>
    </div>
  );
}