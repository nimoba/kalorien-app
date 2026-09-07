'use client';

import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { chartScales, chartTooltip } from '../../utils/colors';
import { Stat } from '../ui/Card';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface GewichtEntry { datum: string; gewicht: number; fett: number | null; muskel: number | null; wasser: number | null; }

const COLORS = { fett: '#f9a8d4', muskel: '#bef264', wasser: '#7dd3fc' };

export default function GewichtKomponentenChart() {
  const [data, setData] = useState<GewichtEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gewicht-komponenten')
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 240 }} />;
  const withComp = data.filter((e) => e.fett !== null || e.muskel !== null || e.wasser !== null);
  if (withComp.length === 0) return null;

  const first = withComp[0];
  const last = withComp[withComp.length - 1];
  const delta = (a: number | null, b: number | null) => (a !== null && b !== null ? Math.round((b - a) * 10) / 10 : null);
  const d = { fett: delta(first.fett, last.fett), muskel: delta(first.muskel, last.muskel), wasser: delta(first.wasser, last.wasser) };
  const fmtDelta = (v: number | null) => (v === null ? '' : `${v > 0 ? '+' : ''}${v} % seit ${first.datum}`);

  const chart: ChartData<'line'> = {
    labels: data.map((e) => e.datum.split('.').slice(0, 2).join('.') + '.'),
    datasets: [
      { label: 'Körperfett', data: data.map((e) => e.fett), borderColor: COLORS.fett, tension: 0.3, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, spanGaps: true },
      { label: 'Muskeln', data: data.map((e) => e.muskel), borderColor: COLORS.muskel, tension: 0.3, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, spanGaps: true },
      { label: 'Wasser', data: data.map((e) => e.wasser), borderColor: COLORS.wasser, tension: 0.3, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4, spanGaps: true, borderDash: [3, 4] },
    ],
  };
  const options: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false }, tooltip: { ...chartTooltip(), displayColors: true, callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue} %` } } },
    interaction: { mode: 'index', intersect: false },
    scales: chartScales(),
  };

  return (
    <section className="card">
      <div style={{ marginBottom: 12 }}>
        <h3 className="card-title">Körperzusammensetzung</h3>
        <p className="card-subtitle">Letzte 30 Tage</p>
      </div>
      <div className="grid-3" style={{ marginBottom: 12 }}>
        <Stat value={last.fett !== null ? `${last.fett} %` : '–'} label={`Fett ${fmtDelta(d.fett)}`} color={COLORS.fett} size="sm" />
        <Stat value={last.muskel !== null ? `${last.muskel} %` : '–'} label={`Muskeln ${fmtDelta(d.muskel)}`} color={COLORS.muskel} size="sm" />
        <Stat value={last.wasser !== null ? `${last.wasser} %` : '–'} label={`Wasser ${fmtDelta(d.wasser)}`} color={COLORS.wasser} size="sm" />
      </div>
      <div style={{ height: 180 }}><Line data={chart} options={options} /></div>
    </section>
  );
}
