'use client';

import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement, BarController, LineController,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useEffect, useState } from "react";
import { chartScales, chartTooltip } from "../../utils/colors";
import { Segmented } from "../ui/Field";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, LineElement, PointElement, BarController, LineController);

interface Props { refresh?: number; }
interface HistoryEntry { datum: string; kalorien: number; ziel: number; geloggt: boolean; }
type Range = '7' | '30' | '90';

export function WochenChart({ refresh }: Props) {
  const [range, setRange] = useState<Range>('30');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/history?days=${range}`)
      .then((r) => r.json())
      .then((d) => { setHistory(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refresh, range]);

  // Aggregate to weeks for the 90-day view so bars stay readable
  const rows = range === '90' ? aggregateWeeks(history) : history;
  const logged = rows.filter((r) => r.geloggt);
  const avg = logged.length ? Math.round(logged.reduce((s, r) => s + r.kalorien, 0) / logged.length) : 0;
  const avgPct = logged.length ? logged.reduce((s, r) => s + (r.ziel ? r.kalorien / r.ziel : 0), 0) / logged.length : 0;

  const labels = rows.map((r) => shortLabel(r.datum, range));
  const colors = rows.map((r) => {
    if (!r.geloggt) return 'rgba(255,255,255,0.06)';
    const p = r.ziel ? r.kalorien / r.ziel : 0;
    return p > 1.1 ? '#fb7185' : p >= 0.9 ? '#bef264' : '#71717a';
  });

  const data: ChartData<"bar" | "line"> = {
    labels,
    datasets: [
      { type: "bar", label: "kcal", data: rows.map((r) => r.kalorien), backgroundColor: colors, borderRadius: 4, borderSkipped: false, barPercentage: 0.7, categoryPercentage: 0.8 },
      { type: "line", label: "Ziel", data: rows.map((r) => r.ziel), borderColor: "rgba(255,255,255,0.3)", borderDash: [4, 5], pointRadius: 0, borderWidth: 1, stepped: true },
    ],
  };

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: { ...chartTooltip(), callbacks: { label: (c) => `${c.dataset.label}: ${Math.round(Number(c.parsed.y))} kcal` } },
    },
    scales: chartScales({ beginAtZero: true }),
  };

  return (
    <section className="card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <h3 className="card-title">Verlauf</h3>
          <p className="card-subtitle">
            {logged.length ? `Ø ${avg.toLocaleString('de-DE')} kcal · ${Math.round(avgPct * 100)} % vom Ziel` : 'Keine geloggten Tage'}
          </p>
        </div>
      </div>
      <Segmented value={range} onChange={setRange} options={[{ value: '7', label: '7 Tage' }, { value: '30', label: '30 Tage' }, { value: '90', label: '90 Tage' }]} />
      <div style={{ height: 190, marginTop: 12 }}>
        {loading ? <div className="skeleton" style={{ height: '100%' }} /> : <Chart type="bar" data={data} options={options} />}
      </div>
    </section>
  );
}

function aggregateWeeks(rows: HistoryEntry[]): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (let i = 0; i < rows.length; i += 7) {
    const chunk = rows.slice(i, i + 7);
    const logged = chunk.filter((r) => r.geloggt);
    out.push({
      datum: chunk[0].datum,
      kalorien: logged.length ? Math.round(logged.reduce((s, r) => s + r.kalorien, 0) / logged.length) : 0,
      ziel: chunk.length ? Math.round(chunk.reduce((s, r) => s + r.ziel, 0) / chunk.length) : 0,
      geloggt: logged.length > 0,
    });
  }
  return out;
}

function shortLabel(datum: string, range: Range) {
  const [d, m] = datum.split('.');
  if (range === '7') {
    const dt = new Date(new Date().getFullYear(), Number(m) - 1, Number(d));
    return dt.toLocaleDateString('de-DE', { weekday: 'short' });
  }
  return `${d}.${m}.`;
}
