'use client';

import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";
import Page, { ErrorState, Loading } from "../components/ui/Page";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import { Stat } from "../components/ui/Card";
import { Segmented } from "../components/ui/Field";
import { useToast } from "../components/ui/Toast";
import GewichtForm from "../components/GewichtForm";
import GewichtKomponentenChart from "../components/charts/GewichtKomponentenChart";
import { chartScales, chartTooltip } from "../utils/colors";
import { todayISO } from "../lib/date";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Entry { datum: string; gewicht: number }
interface GewichtData {
  startgewicht: number;
  verlauf: Entry[];
  theoretisch: Entry[];
  geglättet: Entry[];
  trend: Entry[];
  trendSteigung: number;
  zielGewicht: number | null;
}
type Range = '30' | '90' | 'all';

export default function GewichtSeite() {
  const toast = useToast();
  const [data, setData] = useState<GewichtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState<Range>('90');
  const [showForm, setShowForm] = useState(false);
  const [analyse, setAnalyse] = useState<string | null>(null);
  const [analyseLoading, setAnalyseLoading] = useState(false);
  const [showTheory, setShowTheory] = useState(true);

  const load = () => {
    setLoading(true);
    fetch("/api/weight-history")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };
  useEffect(load, []);

  const handleAnalyse = async () => {
    setAnalyseLoading(true);
    try {
      const res = await fetch("/api/analyse", { method: "POST" });
      const d = await res.json();
      setAnalyse(d.analyse || "Keine Analyse verfügbar");
    } catch {
      toast.error('Analyse fehlgeschlagen');
    }
    setAnalyseLoading(false);
  };

  if (loading) return <Page title="Gewicht"><Loading text="Lade Gewichtsdaten…" /></Page>;
  if (error || !data) return <Page title="Gewicht"><ErrorState text="Gewichtsdaten konnten nicht geladen werden" onRetry={load} /></Page>;

  const { startgewicht, verlauf, theoretisch, geglättet, trend, trendSteigung, zielGewicht } = data;
  const n = range === 'all' ? verlauf.length : Math.min(verlauf.length, Number(range));
  const slice = <T,>(arr: T[]) => arr.slice(arr.length - n);

  const letzte = verlauf[verlauf.length - 1]?.gewicht ?? startgewicht;
  const diff = Math.round((letzte - startgewicht) * 10) / 10;
  const wochenTrend = Math.round(trendSteigung * 7 * 100) / 100;

  // Direction-aware status: losing is good only if the goal is below the start weight
  const wantsLoss = zielGewicht ? zielGewicht < startgewicht : true;
  const towardsGoal = wantsLoss ? diff < 0 : diff > 0;
  const statusColor = Math.abs(diff) < 0.5 ? 'var(--text-2)' : towardsGoal ? 'var(--accent)' : 'var(--danger)';

  const zielDiff = zielGewicht ? Math.round((letzte - zielGewicht) * 10) / 10 : null;
  const movingRightWay = zielGewicht ? (wantsLoss ? trendSteigung < 0 : trendSteigung > 0) : false;
  const tageBisZiel = zielGewicht && Math.abs(trendSteigung) > 0.001 && movingRightWay ? Math.ceil(Math.abs(letzte - zielGewicht) / Math.abs(trendSteigung)) : null;

  const labels = slice(verlauf).map((e) => e.datum.split('.').slice(0, 2).join('.') + '.');
  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      { label: "Gewicht", data: slice(verlauf).map((e) => e.gewicht), borderColor: "rgba(255,255,255,0.35)", borderWidth: 1, pointRadius: 0, tension: 0.2 },
      { label: "7-Tage-Schnitt", data: slice(geglättet).map((e) => e.gewicht), borderColor: "#bef264", borderWidth: 2.5, pointRadius: 0, tension: 0.3 },
      { label: "Trend", data: slice(trend).map((e) => e.gewicht), borderColor: "rgba(190,242,100,0.5)", borderDash: [3, 4], borderWidth: 1, pointRadius: 0 },
      ...(showTheory ? [{ label: "Theoretisch (aus Bilanz)", data: slice(theoretisch).map((e) => e.gewicht), borderColor: "#f9a8d4", borderDash: [5, 5], borderWidth: 1.5, pointRadius: 0, tension: 0.2 }] : []),
      ...(zielGewicht ? [{ label: "Ziel", data: new Array(labels.length).fill(zielGewicht), borderColor: "rgba(255,255,255,0.2)", borderWidth: 1, pointRadius: 0, borderDash: [2, 3] }] : []),
    ],
  };
  const options: ChartOptions<'line'> = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
    plugins: { legend: { display: false }, tooltip: { ...chartTooltip(), displayColors: true, callbacks: { label: (c) => `${c.dataset.label}: ${c.formattedValue} kg` } } },
    interaction: { mode: 'index', intersect: false },
    scales: chartScales(),
  };

  return (
    <Page
      title="Gewicht"
      subtitle={verlauf.length ? `Letzter Eintrag ${verlauf[verlauf.length - 1].datum}` : 'Noch keine Einträge'}
      right={<Button variant="primary" size="sm" icon="plus" onClick={() => setShowForm(true)}>Eintragen</Button>}
    >
      <div className="stack">
        <section className="card">
          <div className="grid-3">
            <Stat value={`${letzte.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kg`} label="Aktuell" size="lg" />
            <Stat value={`${diff > 0 ? '+' : ''}${diff.toLocaleString('de-DE')} kg`} label={`seit Start (${startgewicht} kg)`} color={statusColor} />
            <Stat value={`${wochenTrend > 0 ? '+' : ''}${wochenTrend.toLocaleString('de-DE')} kg`} label="Trend pro Woche" color={Math.abs(wochenTrend) < 0.05 ? 'var(--text-2)' : (wantsLoss ? wochenTrend < 0 : wochenTrend > 0) ? 'var(--accent)' : 'var(--danger)'} />
          </div>
          <div className="divider" />
          <div className="row" style={{ gap: 12 }}>
            <div className="icon-box" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}><Icon name="target" size={18} /></div>
            <div style={{ flex: 1 }}>
              {!zielGewicht ? (
                <span className="small muted">Kein Zielgewicht gesetzt. In den Zielen auf dem Dashboard eintragen.</span>
              ) : (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {zielDiff !== null && Math.abs(zielDiff) < 0.3 ? 'Zielgewicht erreicht' : `Noch ${Math.abs(zielDiff || 0).toLocaleString('de-DE')} kg bis ${zielGewicht} kg`}
                  </div>
                  <div className="small faint">
                    {tageBisZiel ? `Bei aktuellem Trend in etwa ${tageBisZiel} Tagen` : Math.abs(trendSteigung) <= 0.001 ? 'Trend ist flach' : 'Trend zeigt gerade in die andere Richtung'}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div>
              <h3 className="card-title">Verlauf</h3>
              <p className="card-subtitle">Geglättet, Trend und Theorie aus der Kalorienbilanz</p>
            </div>
          </div>
          <Segmented value={range} onChange={setRange} options={[{ value: '30', label: '30 Tage' }, { value: '90', label: '90 Tage' }, { value: 'all', label: 'Alles' }]} />
          <div style={{ height: 240, marginTop: 12 }}><Line data={chartData} options={options} /></div>
          <div className="row" style={{ marginTop: 10, gap: 14, flexWrap: 'wrap' }}>
            <LegendItem color="#bef264" label="7-Tage-Schnitt" />
            <LegendItem color="rgba(255,255,255,0.35)" label="Messung" />
            <button className="row tiny" style={{ gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: showTheory ? 'var(--text-2)' : 'var(--text-3)', textDecoration: showTheory ? 'none' : 'line-through' }} onClick={() => setShowTheory((v) => !v)}>
              <span style={{ width: 14, height: 2, background: '#f9a8d4', display: 'inline-block' }} /> Theoretisch
            </button>
          </div>
        </section>

        <GewichtKomponentenChart />

        <section className="card">
          <div className="row-between">
            <div>
              <h3 className="card-title">KI-Analyse</h3>
              <p className="card-subtitle">Einschätzung zu Gewicht und Bilanz</p>
            </div>
            <Button size="sm" icon="sparkles" onClick={handleAnalyse} loading={analyseLoading}>{analyse ? 'Neu' : 'Analysieren'}</Button>
          </div>
          {analyse && <p className="small muted" style={{ marginTop: 12, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{analyse}</p>}
        </section>
      </div>

      <GewichtForm open={showForm} onClose={() => setShowForm(false)} onSaved={load} date={todayISO()} />
    </Page>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="row tiny faint" style={{ gap: 6 }}>
      <span style={{ width: 14, height: 2, background: color, display: 'inline-block' }} /> {label}
    </span>
  );
}
