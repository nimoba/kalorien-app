'use client';

import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface KcalHistoryEntry {
  datum: string;
  kcalKumuliert: number;
  verbrauchKumuliert: number;
}

export default function KcalBilanzChart({ refresh }: { refresh: number }) {
  const [data, setData] = useState<KcalHistoryEntry[]>([]);
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

  if (data.length === 0) {
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
        <p style={{ color: "#71717a", margin: 0, textAlign: 'center' }}>Keine Bilanz-Daten verfügbar</p>
      </motion.div>
    );
  }

  const labels = data.map((e) => e.datum);
  const gegessen = data.map((e) => e.kcalKumuliert);
  const verbraucht = data.map((e) => e.verbrauchKumuliert);

  const letzteGegessen = gegessen[gegessen.length - 1] || 0;
  const letzteVerbraucht = verbraucht[verbraucht.length - 1] || 0;
  const bilanz = letzteGegessen - letzteVerbraucht;

  const getStatusInfo = () => {
    if (bilanz <= -3000) return { color: '#10b981', text: 'Excellent', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' };
    if (bilanz <= -1000) return { color: '#22c55e', text: 'Good', gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)' };
    if (bilanz <= 1000) return { color: '#f59e0b', text: 'Balance', gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)' };
    return { color: '#ef4444', text: 'Watch out', gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)' };
  };

  const statusInfo = getStatusInfo();

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Gegessen",
        data: gegessen,
        borderColor: "#8b5cf6",
        backgroundColor: "rgba(139, 92, 246, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: "#8b5cf6",
      },
      {
        label: "Verbrauch",
        data: verbraucht,
        borderColor: "#6366f1",
        borderDash: [4, 4],
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: "#6366f1",
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
        beginAtZero: false,
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
      transition={{ duration: 0.4, delay: 0.3 }}
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
            Kalorienbilanz
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 12,
            color: '#71717a',
          }}>
            Verbrauch vs. Aufnahme
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

      {/* Bilanz Display */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            color: statusInfo.color,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {bilanz >= 0 ? '+' : ''}{Math.round(bilanz).toLocaleString()}
          </div>
          <div style={{
            fontSize: 12,
            color: '#71717a',
            marginTop: 2,
          }}>
            kcal {bilanz < 0 ? 'Defizit' : 'Überschuss'}
          </div>
        </div>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${statusInfo.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {bilanz < 0 ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={statusInfo.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              <polyline points="17 18 23 18 23 12" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={statusInfo.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          )}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '240px' }}>
        <Line data={chartData} options={options} />
      </div>
    </motion.div>
  );
}
