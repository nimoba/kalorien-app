'use client';

import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { useEffect, useState } from "react";
import { chartScales, chartTooltip } from "../../utils/colors";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

interface KcalHistoryEntry { datum: string; kcalKumuliert: number; verbrauchKumuliert: number; }

export default function KcalBilanzChart({ refresh }: { refresh: number }) {
  const [data, setData] = useState<KcalHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/kcal-history")
      .then((res) => res.json())
      .then((res) => { setData(Array.isArray(res) ? res : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [refresh]);

  const last = data[data.length - 1];
  const bilanz = last ? last.kcalKumuliert - last.verbrauchKumuliert : 0;
  const kg = bilanz / 7700;

  const chartData: ChartData<"line"> = {
    labels: data.map((e) => e.datum.split('.').slice(0, 2).join('.') + '.'),
    datasets: [
      { label: "Gegessen", data: data.map((e) => e.kcalKumuliert), borderColor: "#bef264", backgroundColor: "rgba(190,242,100,0.06)", fill: true, tension: 0.3, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
      { label: "Verbrauch", data: data.map((e) => e.verbrauchKumuliert), borderColor: "rgba(255,255,255,0.35)", borderDash: [4, 5], tension: 0.3, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4 },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { display: false },
      tooltip: { ...chartTooltip(), callbacks: { label: (c) => `${c.dataset.label}: ${Math.round(Number(c.parsed.y)).toLocaleString('de-DE')} kcal` } },
    },
    interaction: { mode: "index", intersect: false },
    scales: chartScales(),
  };

  return (
    <section className="card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <h3 className="card-title">Gesamtbilanz</h3>
          <p className="card-subtitle">Kumuliert seit Beginn</p>
        </div>
        {last && (
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontWeight: 700, color: bilanz <= 0 ? 'var(--accent)' : 'var(--danger)' }}>
              {bilanz > 0 ? '+' : ''}{Math.round(bilanz).toLocaleString('de-DE')} kcal
            </div>
            <div className="tiny faint">≈ {kg > 0 ? '+' : ''}{kg.toFixed(1)} kg</div>
          </div>
        )}
      </div>
      <div style={{ height: 180 }}>
        {loading ? <div className="skeleton" style={{ height: '100%' }} /> : data.length === 0 ? <div className="empty">Noch keine Daten</div> : <Line data={chartData} options={options} />}
      </div>
    </section>
  );
}
