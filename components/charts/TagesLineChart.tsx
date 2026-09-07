'use client';

import {
  Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend, LineController,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { chartScales, chartTooltip } from '../../utils/colors';

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Filler, Tooltip, Legend, LineController);

interface Props {
  eintraege: { zeit: string; kcal: number }[];
  ziel: number;
  isToday: boolean;
}

export function TagesLineChart({ eintraege, ziel, isToday }: Props) {
  const labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  const perHour: Record<number, number> = {};
  for (const { zeit, kcal } of eintraege) {
    const hour = parseInt((zeit || '0').split(':')[0], 10) || 0;
    perHour[hour] = (perHour[hour] || 0) + kcal;
  }

  const currentHour = isToday ? new Date().getHours() : 23;
  const werte: (number | null)[] = [];
  let sum = 0;
  for (let h = 0; h < 24; h++) {
    if (perHour[h] !== undefined) sum += perHour[h];
    werte.push(h <= currentHour ? sum : null);
  }

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Gegessen',
        data: werte,
        fill: true,
        borderColor: '#bef264',
        backgroundColor: 'rgba(190, 242, 100, 0.08)',
        tension: 0.35,
        spanGaps: false,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
      {
        label: 'Ziel',
        data: new Array(24).fill(ziel),
        borderDash: [4, 5],
        borderColor: 'rgba(255,255,255,0.25)',
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: {
      legend: { display: false },
      tooltip: { ...chartTooltip(), callbacks: { label: (c) => `${Math.round(Number(c.parsed.y))} kcal` } },
    },
    interaction: { mode: 'index', intersect: false },
    scales: chartScales({ beginAtZero: true }),
  };

  return (
    <section className="card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <h3 className="card-title">Tagesverlauf</h3>
          <p className="card-subtitle">Kumulierte Kalorien über den Tag</p>
        </div>
        {eintraege.length > 0 && <span className="badge">{eintraege.length} {eintraege.length === 1 ? 'Eintrag' : 'Einträge'}</span>}
      </div>
      <div style={{ height: 170 }}>
        <Line data={data} options={options} />
      </div>
    </section>
  );
}
