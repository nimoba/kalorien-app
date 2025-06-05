'use client';

import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

interface GewichtEntry {
  datum: string;
  gewicht: number;
  fett: number | null;
  muskel: number | null;
  wasser: number | null;
}

const GewichtKomponentenChart: React.FC = () => {
  const [data, setData] = useState<GewichtEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gewicht-komponenten')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return React.createElement('p', { style: { color: "#fff" } }, '⏳ Lade Gewichtskomponenten...');
  }

  if (!data || data.length === 0) {
    return React.createElement('p', { style: { color: "#fff" } }, 'Keine Gewichtsdaten verfügbar');
  }

  // Letzten 30 Tage
  const last30Days = data.slice(-30);

  const labels = last30Days.map(entry => entry.datum);
  const wasserKg = last30Days.map(entry => {
    if (!entry.wasser || !entry.gewicht) return 0;
    return (entry.wasser / 100) * entry.gewicht;
  });
  const fettKg = last30Days.map(entry => {
    if (!entry.fett || !entry.gewicht) return 0;
    return (entry.fett / 100) * entry.gewicht;
  });
  const muskelKg = last30Days.map(entry => {
    if (!entry.muskel || !entry.gewicht) return 0;
    return (entry.muskel / 100) * entry.gewicht;
  });
  const restKg = last30Days.map((entry, i) => {
    const wasser = wasserKg[i] || 0;
    const fett = fettKg[i] || 0;
    const muskel = muskelKg[i] || 0;
    return Math.max(0, entry.gewicht - wasser - fett - muskel);
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Wasser',
        data: wasserKg,
        backgroundColor: '#3498db',
        borderRadius: 2,
      },
      {
        label: 'Fett',
        data: fettKg,
        backgroundColor: '#ffa600',
        borderRadius: 2,
      },
      {
        label: 'Muskel',
        data: muskelKg,
        backgroundColor: '#00cc99',
        borderRadius: 2,
      },
      {
        label: 'Rest',
        data: restKg,
        backgroundColor: '#95a5a6',
        borderRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#fff',
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(1);
            return `${label}: ${value} kg`;
          },
          afterLabel: (context: any) => {
            const total = context.parsed.y;
            const entry = last30Days[context.dataIndex];
            if (entry.gewicht) {
              const percentage = ((total / entry.gewicht) * 100).toFixed(1);
              return `(${percentage}%)`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#fff',
          maxRotation: 45,
        },
        grid: {
          color: '#444',
        },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: '#fff',
          callback: function(value: any) {
            return value + ' kg';
          },
        },
        grid: {
          color: '#444',
        },
      },
    },
  };

  return React.createElement('div', { style: { marginTop: 50 } }, [
    React.createElement('h2', { 
      key: 'title',
      style: { color: '#fff', marginBottom: 20 } 
    }, '⚖️ Gewichtskomponenten (Letzte 30 Tage)'),
    React.createElement('div', { 
      key: 'chart',
      style: { height: '400px' } 
    }, React.createElement(Bar, { data: chartData, options: options }))
  ]);
};

export default GewichtKomponentenChart;