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

  // ✨ Zeige nur jeden 3. Tag für bessere Übersicht
  const filteredData = last30Days.filter((_, index) => index % 3 === 0);
  
  const labels = filteredData.map(entry => {
    const [tag, monat] = entry.datum.split('.');
    return `${tag}.${monat}`;
  });

  // ✨ KORRIGIERTE BERECHNUNG mit realistischen Werten
  const fettKg = filteredData.map(entry => {
    if (!entry.fett || !entry.gewicht) return 0;
    return (entry.fett / 100) * entry.gewicht;
  });

  // ✨ Muskel-Wasser (ca. 20% der Muskelmasse ist Wasser)
  const muskelTrockenKg = filteredData.map(entry => {
    if (!entry.muskel || !entry.gewicht) return 0;
    const gesamtMuskel = (entry.muskel / 100) * entry.gewicht;
    return gesamtMuskel * 0.75; // 75% "trockene" Muskelmasse
  });

  const muskelWasserKg = filteredData.map(entry => {
    if (!entry.muskel || !entry.gewicht) return 0;
    const gesamtMuskel = (entry.muskel / 100) * entry.gewicht;
    return gesamtMuskel * 0.25; // 25% Wasser in Muskeln
  });

  // ✨ Freies Wasser (Gesamtwasser minus Muskelwasser)
  const freiesWasserKg = filteredData.map((entry, i) => {
    if (!entry.wasser || !entry.gewicht) return 0;
    const gesamtWasser = (entry.wasser / 100) * entry.gewicht;
    const muskelWasser = muskelWasserKg[i] || 0;
    return Math.max(0, gesamtWasser - muskelWasser);
  });

  // ✨ Rest = Knochen, Organe, etc.
  const restKg = filteredData.map((entry, i) => {
    const fett = fettKg[i] || 0;
    const muskelTrocken = muskelTrockenKg[i] || 0;
    const muskelWasser = muskelWasserKg[i] || 0;
    const freiesWasser = freiesWasserKg[i] || 0;
    return Math.max(0, entry.gewicht - fett - muskelTrocken - muskelWasser - freiesWasser);
  });

  // ✨ VERBESSERTE Y-ACHSE: Fokus auf relevanten Bereich
  const allWeights = filteredData.map(entry => entry.gewicht);
  const minWeight = Math.min(...allWeights);
  const maxWeight = Math.max(...allWeights);
  const weightRange = maxWeight - minWeight;
  
  // Wenn Änderungen < 5kg, dann mehr zoomen
  const zoomFactor = weightRange < 5 ? 0.05 : 0.1;
  const padding = Math.max(weightRange * zoomFactor, 1);
  
  const yAxisMin = Math.max(0, minWeight - padding);
  const yAxisMax = maxWeight + padding;

  const chartData = {
    labels,
    datasets: [
      // ✨ Reihenfolge: von unten nach oben
      {
        label: 'Fett',
        data: fettKg,
        backgroundColor: '#ff6b6b',
        borderRadius: 2,
      },
      {
        label: 'Muskeln (trocken)',
        data: muskelTrockenKg,
        backgroundColor: '#4ecdc4',
        borderRadius: 2,
      },
      {
        label: 'Wasser in Muskeln',
        data: muskelWasserKg,
        backgroundColor: '#45b7d1',
        // ✨ Schraffiert-Effekt durch Pattern (Fallback: transparenter)
        borderColor: '#4ecdc4',
        borderWidth: 2,
        borderSkipped: false,
        borderRadius: 2,
      },
      {
        label: 'Freies Wasser',
        data: freiesWasserKg,
        backgroundColor: '#96ceb4',
        borderRadius: 2,
      },
      {
        label: 'Rest (Knochen, Organe)',
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
            size: 11,
          },
          usePointStyle: true,
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
            const entry = filteredData[context.dataIndex];
            if (entry.gewicht) {
              const percentage = ((total / entry.gewicht) * 100).toFixed(1);
              return `(${percentage}%)`;
            }
            return '';
          },
          footer: (tooltipItems: any) => {
            const dataIndex = tooltipItems[0].dataIndex;
            const entry = filteredData[dataIndex];
            return `Gesamt: ${entry.gewicht.toFixed(1)} kg`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#fff',
          maxRotation: 0, // Bessere Lesbarkeit
          font: {
            size: 10,
          },
        },
        grid: {
          color: '#333',
        },
      },
      y: {
        stacked: true,
        // ✨ Dynamische Y-Achse für bessere Sichtbarkeit
        min: yAxisMin,
        max: yAxisMax,
        ticks: {
          color: '#fff',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value.toFixed(1) + ' kg';
          },
        },
        grid: {
          color: '#333',
        },
      },
    },
  };

  // ✨ Trend-Berechnung für Summary
  const firstEntry = filteredData[0];
  const lastEntry = filteredData[filteredData.length - 1];
  const gewichtTrend = lastEntry.gewicht - firstEntry.gewicht;
  const fettTrend = ((lastEntry.fett || 0) - (firstEntry.fett || 0));
  const muskelTrend = ((lastEntry.muskel || 0) - (firstEntry.muskel || 0));

  return React.createElement('div', { style: { marginTop: 50 } }, [
    React.createElement('h2', { 
      key: 'title',
      style: { color: '#fff', marginBottom: 20 } 
    }, '⚖️ Körperzusammensetzung (Monatstrend)'),
    
    // ✨ Trend-Summary
    React.createElement('div', {
      key: 'summary',
      style: {
        backgroundColor: '#1e1e1e',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 16,
        fontSize: 14,
      }
    }, [
      React.createElement('div', { key: 'weight-trend', style: { textAlign: 'center' } }, [
        React.createElement('div', { key: 'weight-label', style: { color: '#ccc' } }, 'Gewicht'),
        React.createElement('div', { 
          key: 'weight-value', 
          style: { 
            color: gewichtTrend >= 0 ? '#ff6b6b' : '#4ecdc4',
            fontSize: 16,
            fontWeight: 'bold'
          } 
        }, `${gewichtTrend >= 0 ? '+' : ''}${gewichtTrend.toFixed(1)} kg`)
      ]),
      React.createElement('div', { key: 'fat-trend', style: { textAlign: 'center' } }, [
        React.createElement('div', { key: 'fat-label', style: { color: '#ccc' } }, 'Fett'),
        React.createElement('div', { 
          key: 'fat-value', 
          style: { 
            color: fettTrend <= 0 ? '#4ecdc4' : '#ff6b6b',
            fontSize: 16,
            fontWeight: 'bold'
          } 
        }, `${fettTrend >= 0 ? '+' : ''}${fettTrend.toFixed(1)}%`)
      ]),
      React.createElement('div', { key: 'muscle-trend', style: { textAlign: 'center' } }, [
        React.createElement('div', { key: 'muscle-label', style: { color: '#ccc' } }, 'Muskel'),
        React.createElement('div', { 
          key: 'muscle-value', 
          style: { 
            color: muskelTrend >= 0 ? '#4ecdc4' : '#ff6b6b',
            fontSize: 16,
            fontWeight: 'bold'
          } 
        }, `${muskelTrend >= 0 ? '+' : ''}${muskelTrend.toFixed(1)}%`)
      ])
    ]),
    
    React.createElement('div', { 
      key: 'chart',
      style: { height: '450px' } 
    }, React.createElement(Bar, { data: chartData, options: options }))
  ]);
};

export default GewichtKomponentenChart;