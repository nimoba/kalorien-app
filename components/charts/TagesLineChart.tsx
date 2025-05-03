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
  let sum = 0;
  const werte: number[] = [];
  let lastHourWithData = -1;

  for (let h = 0; h < 24; h++) {
    if (kcalPerHour[h] !== undefined) {
      sum += kcalPerHour[h];
      lastHourWithData = h;
    }

    // Fill value only up to the last hour with data, else NaN (line stops)
    if (lastHourWithData >= 0 && h <= lastHourWithData) {
      werte.push(sum);
    } else {
      werte.push(NaN);
    }
  }

  // 4. Prepare goal array (same rule as values)
  const zielArray = werte.map((_, i) =>
    i <= lastHourWithData ? ziel : NaN
  );

  // 5. Determine color
  const maxKcal = Math.max(...werte.filter((v) => !isNaN(v)));
  const farbe = getOvershootColor(maxKcal, ziel, '#36a2eb');

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
      },
      {
        label: 'Tagesziel',
        data: zielArray,
        borderDash: [6, 6],
        borderColor: '#ff6384',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1,
        spanGaps: false,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>⏰ Kalorien nach Uhrzeit</h3>
      <Line data={data} options={options} />
    </div>
  );
}
