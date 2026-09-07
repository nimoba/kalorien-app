'use client';

import { useState } from 'react';
import Page from '../components/ui/Page';
import Button from '../components/ui/Button';

interface Result {
  success: boolean;
  message: string;
  stats: { totalEntries: number; activeDays: number; maxStreak: number; foodDays: number; weightDays: number; achievements: Record<string, number> };
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBackfill = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/backfill-habits', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (res.ok) setResult(data); else setError(data.error || 'Unbekannter Fehler');
    } catch (err) {
      setError('Netzwerkfehler: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Admin" subtitle="Wartungsfunktionen">
      <div className="stack">
        <section className="card">
          <h3 className="card-title">Habit-Daten nachfüllen</h3>
          <p className="small muted" style={{ marginTop: 6, lineHeight: 1.5 }}>
            Liest alle Essens- und Gewichtseinträge und baut daraus die historische Habits-Tabelle inklusive Streaks neu auf.
          </p>
          <Button variant="primary" style={{ marginTop: 14 }} onClick={runBackfill} loading={loading}>Backfill starten</Button>
        </section>
        {error && <section className="card" style={{ borderColor: 'rgba(251,113,133,0.4)' }}><p className="small" style={{ color: 'var(--danger)' }}>{error}</p></section>}
        {result && (
          <section className="card">
            <h3 className="card-title">Fertig</h3>
            <p className="small muted" style={{ marginTop: 6 }}>{result.message}</p>
            <div className="grid-3" style={{ marginTop: 12 }}>
              {[['Einträge', result.stats.totalEntries], ['Aktive Tage', result.stats.activeDays], ['Längster Streak', result.stats.maxStreak], ['Essen-Tage', result.stats.foodDays], ['Gewichts-Tage', result.stats.weightDays]].map(([l, v]) => (
                <div key={String(l)} className="card-flat" style={{ textAlign: 'center' }}>
                  <div className="num" style={{ fontWeight: 700, fontSize: 18 }}>{v}</div>
                  <div className="tiny faint">{l}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </Page>
  );
}
