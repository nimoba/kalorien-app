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

  // 5. Color logic
  const maxKcal = Math.max(...werte.filter((v): v is number => v !== null));
  const farbe = getOvershootColor(maxKcal, ziel, '#36a2eb');

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
      },
      {
        label: 'Tagesziel',
        data: zielArray,
        borderDash: [6, 6],
        borderColor: '#ff6384',
        borderWidth: 1.5,
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
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#888';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.restore();
    },
  };

  // 8. Chart options
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
      <Line data={data} options={options} plugins={[verticalLinePlugin]} />
    </div>
  );
}
