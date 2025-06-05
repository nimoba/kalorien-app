'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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

const BodyCompositionDashboard: React.FC = () => {
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
    return React.createElement('p', { style: { color: "#fff" } }, '⏳ Lade Körperzusammensetzung...');
  }

  if (!data || data.length === 0) {
    return React.createElement('p', { style: { color: "#fff" } }, 'Keine Daten verfügbar');
  }

  // Letzte 30 Tage für Trends
  const last30Days = data.slice(-30);
  const firstEntry = last30Days[0];
  const lastEntry = last30Days[last30Days.length - 1];

  // 🎯 DELTA-BERECHNUNGEN (Fortschritt!)
  const gewichtDelta = lastEntry.gewicht - firstEntry.gewicht;
  const fettDelta = (lastEntry.fett || 0) - (firstEntry.fett || 0);
  const muskelDelta = (lastEntry.muskel || 0) - (firstEntry.muskel || 0);
  const wasserDelta = (lastEntry.wasser || 0) - (firstEntry.wasser || 0);

  // 📊 Bewertungsfunktion
  const bewerteFortschritt = (wert: number, typ: 'gewicht' | 'fett' | 'muskel' | 'wasser') => {
    switch (typ) {
      case 'gewicht':
        if (wert <= -2) return { farbe: '#27ae60', text: 'Excellent! 🎉', prozent: 95 };
        if (wert <= -0.5) return { farbe: '#2ecc71', text: 'Sehr gut! 💪', prozent: 80 };
        if (wert <= 0.5) return { farbe: '#f39c12', text: 'Stabil 👍', prozent: 60 };
        return { farbe: '#e74c3c', text: 'Aufpassen! ⚠️', prozent: 30 };
      
      case 'fett':
        if (wert <= -2) return { farbe: '#27ae60', text: 'Excellent! 🔥', prozent: 95 };
        if (wert <= -0.5) return { farbe: '#2ecc71', text: 'Super! 💪', prozent: 80 };
        if (wert <= 0.5) return { farbe: '#f39c12', text: 'Ok 👍', prozent: 60 };
        return { farbe: '#e74c3c', text: 'Aufpassen! ⚠️', prozent: 30 };
      
      case 'muskel':
        if (wert >= 2) return { farbe: '#27ae60', text: 'Excellent! 💪', prozent: 95 };
        if (wert >= 0.5) return { farbe: '#2ecc71', text: 'Sehr gut! 🚀', prozent: 80 };
        if (wert >= -0.5) return { farbe: '#f39c12', text: 'Stabil 👍', prozent: 60 };
        return { farbe: '#e74c3c', text: 'Aufpassen! ⚠️', prozent: 30 };
      
      default:
        return { farbe: '#95a5a6', text: 'Normal', prozent: 50 };
    }
  };

  // 📈 CHART DATA (Trend-Linien)
  const chartLabels = last30Days
    .filter((_, i) => i % 3 === 0) // Jeden 3. Tag
    .map(entry => {
      const [tag, monat] = entry.datum.split('.');
      return `${tag}.${monat}`;
    });

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Körperfett (%)',
        data: last30Days
          .filter((_, i) => i % 3 === 0)
          .map(entry => entry.fett),
        borderColor: '#e74c3c',
        backgroundColor: '#e74c3c33',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Muskelmasse (%)',
        data: last30Days
          .filter((_, i) => i % 3 === 0)
          .map(entry => entry.muskel),
        borderColor: '#27ae60',
        backgroundColor: '#27ae6033',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Wasseranteil (%)',
        data: last30Days
          .filter((_, i) => i % 3 === 0)
          .map(entry => entry.wasser),
        borderColor: '#3498db',
        backgroundColor: '#3498db33',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
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
        ticks: { color: '#ccc', font: { size: 11 } },
        grid: { color: '#333' },
      },
    },
  };

  // 🎨 Delta-Card Komponente
  const createDeltaCard = (
    icon: string,
    titel: string,
    wert: number,
    einheit: string,
    typ: 'gewicht' | 'fett' | 'muskel' | 'wasser'
  ) => {
    const bewertung = bewerteFortschritt(wert, typ);
    
    return React.createElement('div', {
      style: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 20,
        border: `2px solid ${bewertung.farbe}33`,
        position: 'relative',
        overflow: 'hidden',
      }
    }, [
      // Hintergrund-Balken (Progress-Bar-Effekt)
      React.createElement('div', {
        key: 'bg-bar',
        style: {
          position: 'absolute',
          top: 0, left: 0, bottom: 0,
          width: `${bewertung.prozent}%`,
          backgroundColor: `${bewertung.farbe}11`,
          borderRadius: '12px 0 0 12px',
        }
      }),
      
      // Content
      React.createElement('div', { 
        key: 'content',
        style: { position: 'relative', zIndex: 2 }
      }, [
        React.createElement('div', { 
          key: 'header',
          style: { 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 8
          }
        }, [
          React.createElement('span', { 
            key: 'icon',
            style: { fontSize: 24 }
          }, icon),
          React.createElement('span', { 
            key: 'bewertung',
            style: { 
              fontSize: 12, 
              color: bewertung.farbe,
              fontWeight: 'bold'
            }
          }, bewertung.text)
        ]),
        
        React.createElement('div', { 
          key: 'titel',
          style: { 
            color: '#ccc', 
            fontSize: 14,
            marginBottom: 4
          }
        }, titel),
        
        React.createElement('div', { 
          key: 'wert',
          style: { 
            fontSize: 28,
            fontWeight: 'bold',
            color: bewertung.farbe,
            lineHeight: 1
          }
        }, `${wert >= 0 ? '+' : ''}${wert.toFixed(1)}${einheit}`)
      ])
    ]);
  };

  return React.createElement('div', { style: { marginTop: 50 } }, [
    React.createElement('h2', { 
      key: 'title',
      style: { 
        color: '#fff', 
        marginBottom: 24,
        fontSize: 24,
        fontWeight: 'bold'
      } 
    }, '🏆 Körperzusammensetzung - Fortschritt (30 Tage)'),
    
    // 📊 DELTA CARDS
    React.createElement('div', {
      key: 'delta-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }
    }, [
      createDeltaCard('⚖️', 'Gewichtsveränderung', gewichtDelta, 'kg', 'gewicht'),
      createDeltaCard('🔥', 'Körperfett', fettDelta, '%', 'fett'),
      createDeltaCard('💪', 'Muskelmasse', muskelDelta, '%', 'muskel'),
      createDeltaCard('💧', 'Wasseranteil', wasserDelta, '%', 'wasser'),
    ]),
    
    // 📈 TREND CHART
    React.createElement('div', {
      key: 'chart-container',
      style: {
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        padding: 20,
        marginTop: 24,
      }
    }, [
      React.createElement('h3', {
        key: 'chart-title',
        style: {
          color: '#fff',
          marginBottom: 20,
          fontSize: 18,
        }
      }, '📈 Trend-Verlauf'),
      
      React.createElement('div', { 
        key: 'chart',
        style: { height: '350px' } 
      }, React.createElement(Line, { data: chartData, options: chartOptions }))
    ])
  ]);
};

export default BodyCompositionDashboard;