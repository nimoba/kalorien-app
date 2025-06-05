'use client';

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  LineController,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { getOvershootColor } from '../../utils/colors';

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  Tooltip,
  Legend,
  LineController
);

interface Props {
  eintraege: { zeit: string; kcal: number }[];
  ziel: number;
}

export function TagesLineChart({ eintraege, ziel }: Props) {
  // 1. Create 24 hour labels from 00:00 to 23:00
  const fullDayLabels = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
  );

  // 2. Round entry times to hour and sum kcal per hour
  const kcalPerHour: Record<number, number> = {};
  for (const { zeit, kcal } of eintraege) {
    const [hour] = zeit.split(':').map(Number);
    kcalPerHour[hour] = (kcalPerHour[hour] || 0) + kcal;
  }

  // 3. Compute cumulative kcal per hour
  const werte: (number | null)[] = [];
  const pointRadius: number[] = [];

  const now = new Date();
  const currentHour = now.getHours();

  let sum = 0;
  for (let h = 0; h < 24; h++) {
    if (kcalPerHour[h] !== undefined) {
      sum += kcalPerHour[h];
    }

    if (h <= currentHour) {
      werte.push(sum);
      pointRadius.push(3); // show point
    } else {
      werte.push(null); // break line
      pointRadius.push(0); // hide point
    }
  }

  // 4. Goal line across full 24 hours
  const zielArray = new Array(24).fill(ziel);

  // 5. Color logic & Bewertung
  const maxKcal = Math.max(...werte.filter((v): v is number => v !== null));
  const farbe = getOvershootColor(maxKcal, ziel, '#36a2eb');

  const bewertung = () => {
    const prozent = maxKcal / ziel;
    if (prozent >= 0.95 && prozent <= 1.05) return { farbe: '#27ae60', text: 'Perfect Timing! 🎯' };
    if (prozent >= 0.85 && prozent <= 1.15) return { farbe: '#2ecc71', text: 'Sehr gut! 💪' };
    if (prozent >= 0.7 && prozent <= 1.3) return { farbe: '#f39c12', text: 'Ok 👍' };
    if (prozent > 1.3) return { farbe: '#e74c3c', text: 'Zu viel! ⚠️' };
    return { farbe: '#e74c3c', text: 'Zu wenig! ⚠️' };
  };

  const bewertungInfo = bewertung();

  // 6. Data config
  const data: ChartData<'line'> = {
    labels: fullDayLabels,
    datasets: [
      {
        label: 'Kalorienverlauf',
        data: werte,
        fill: true,
        borderColor: farbe,
        backgroundColor: farbe + '33',
        tension: 0.3,
        spanGaps: false,
        pointRadius,
        borderWidth: 3,
        pointHoverRadius: 8,
      },
      {
        label: 'Tagesziel',
        data: zielArray,
        borderDash: [6, 6],
        borderColor: '#ff6384',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
        spanGaps: true,
      },
    ],
  };

  // 7. Vertical line plugin for current hour
  const verticalLinePlugin = {
    id: 'currentHourLine',
    afterDraw: (chart: any) => {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      const x = xScale.getPixelForValue(currentHour);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffd700';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      // "Jetzt" Label
      ctx.fillStyle = '#ffd700';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Jetzt', x, chartArea.top - 5);
    },
  };

  // 8. Chart options
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        callbacks: {
          label: (context) => {
            if (context.datasetIndex === 0) {
              return `Gegessen: ${context.formattedValue} kcal`;
            }
            return `Ziel: ${context.formattedValue} kcal`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#ccc', font: { size: 10 } },
        grid: { color: '#333' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#ccc', font: { size: 11 } },
        grid: { color: '#333' },
      },
    },
  };

  // Essenszeiten für Stats
  const essenszeiten = Object.keys(kcalPerHour).length;
  const letztesMahl = essenszeiten > 0 ? Math.max(...Object.keys(kcalPerHour).map(Number)) : 0;

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
            ⏰ Kalorien nach Uhrzeit
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
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
          fontSize: 13,
          color: '#ccc'
        }}>
          <div>
            <strong style={{ color: '#fff' }}>{maxKcal}</strong> / {ziel} kcal
          </div>
          <div>
            <strong style={{ color: '#fff' }}>{essenszeiten}</strong> Mahlzeiten
          </div>
          <div>
            Letztes Essen: <strong style={{ color: '#fff' }}>
              {essenszeiten > 0 ? `${letztesMahl}:00` : 'Keine'}
            </strong>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '300px' }}>
          <Line data={data} options={options} plugins={[verticalLinePlugin]} />
        </div>
      </div>
    </div>
  );
}