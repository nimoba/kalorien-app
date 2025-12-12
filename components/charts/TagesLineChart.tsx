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
import { motion } from 'framer-motion';
import { getStatusInfo } from '../../utils/colors';

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
  const fullDayLabels = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, '0')}:00`
  );

  const kcalPerHour: Record<number, number> = {};
  for (const { zeit, kcal } of eintraege) {
    const [hour] = zeit.split(':').map(Number);
    kcalPerHour[hour] = (kcalPerHour[hour] || 0) + kcal;
  }

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
      pointRadius.push(3);
    } else {
      werte.push(null);
      pointRadius.push(0);
    }
  }

  const zielArray = new Array(24).fill(ziel);
  const maxKcal = Math.max(...werte.filter((v): v is number => v !== null));
  const pct = maxKcal / ziel;
  const statusInfo = getStatusInfo(pct);
  const essenszeiten = Object.keys(kcalPerHour).length;
  const letztesMahl = essenszeiten > 0 ? Math.max(...Object.keys(kcalPerHour).map(Number)) : 0;

  const data: ChartData<'line'> = {
    labels: fullDayLabels,
    datasets: [
      {
        label: 'Kalorienverlauf',
        data: werte,
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        spanGaps: false,
        pointRadius,
        borderWidth: 2,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
      },
      {
        label: 'Tagesziel',
        data: zielArray,
        borderDash: [6, 6],
        borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
        spanGaps: true,
      },
    ],
  };

  const verticalLinePlugin = {
    id: 'currentHourLine',
    afterDraw: (chart: import("chart.js").Chart<"line">) => {
      const { ctx, chartArea, scales } = chart;
      const xScale = scales.x;
      const x = xScale.getPixelForValue(currentHour);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Jetzt', x, chartArea.top - 6);
    },
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        displayColors: false,
      },
    },
    scales: {
      x: {
        ticks: { color: '#52525b', font: { size: 9, family: 'Inter, sans-serif' } },
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
      transition={{ duration: 0.4, delay: 0.1 }}
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
            Tagesverlauf
          </h3>
          <p style={{
            margin: '4px 0 0 0',
            fontSize: 12,
            color: '#71717a',
          }}>
            Kalorien nach Uhrzeit
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

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: '10px 12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {maxKcal}
          </div>
          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>Aktuell</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: '10px 12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {essenszeiten}
          </div>
          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>Mahlzeiten</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 12,
          padding: '10px 12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
            {essenszeiten > 0 ? `${letztesMahl}:00` : '-'}
          </div>
          <div style={{ fontSize: 10, color: '#71717a', marginTop: 2 }}>Letzte</div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '240px' }}>
        <Line data={data} options={options} plugins={[verticalLinePlugin]} />
      </div>
    </motion.div>
  );
}
