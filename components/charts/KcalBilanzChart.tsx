'use client';

import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function KcalBilanzChart({ refresh }: { refresh: number }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/kcal-history")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [refresh]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }}>
        <p style={{ color: "#fff", margin: 0 }}>⏳ Lade Bilanz-Daten...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }}>
        <p style={{ color: "#fff", margin: 0 }}>Keine Bilanz-Daten verfügbar</p>
      </div>
    );
  }

  const labels = data.map((e) => e.datum);
  const gegessen = data.map((e) => e.kcalKumuliert);
  const verbraucht = data.map((e) => e.verbrauchKumuliert);

  // Aktuelle Bilanz berechnen
  const letzteGegessen = gegessen[gegessen.length - 1] || 0;
  const letzteVerbraucht = verbraucht[verbraucht.length - 1] || 0;
  const bilanz = letzteGegessen - letzteVerbraucht;

  const bewertung = () => {
    if (bilanz <= -3000) return { farbe: '#27ae60', text: 'Excellent! 🎉' };
    if (bilanz <= -1000) return { farbe: '#2ecc71', text: 'Sehr gut! 💪' };
    if (bilanz <= 1000) return { farbe: '#f39c12', text: 'Ausgeglichen 👍' };
    return { farbe: '#e74c3c', text: 'Aufpassen! ⚠️' };
  };

  const bewertungInfo = bewertung();

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Gegessen (kumuliert)",
        data: gegessen,
        borderColor: "#8e44ad",
        backgroundColor: "#8e44ad33",
        tension: 0.25,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: "Verbrauch (kumuliert)",
        data: verbraucht,
        borderColor: "#36a2eb",
        borderDash: [4, 4],
        tension: 0.15,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
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
        beginAtZero: false,
        ticks: { color: '#ccc', font: { size: 11 } },
        grid: { color: '#333' },
      },
    },
  };

  // Bilanz-Prozent für Hintergrund (basierend auf -5000 bis +5000 kcal Range)
  const bilanzProzent = Math.min(100, Math.abs(bilanz / 5000) * 100);

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      borderRadius: 12,
      padding: 20,
      marginTop: 24,
      border: `2px solid ${bewertungInfo.farbe}33`,
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
            marginBottom: 0, 
            color: '#fff',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            📉 Kcal-Bilanz (Verbrauch vs. Realität)
          </h3>
          <span style={{
            fontSize: 12,
            color: bewertungInfo.farbe,
            fontWeight: 'bold'
          }}>
            {bewertungInfo.text}
          </span>
        </div>

        {/* Chart */}
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
}