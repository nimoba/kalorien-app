'use client';

import React from 'react';
import Icon from '../ui/Icon';
import { Stat } from '../ui/Card';
import type { DashboardData } from '../../types/dashboard';

interface Props {
  woche: DashboardData['woche'];
  gewicht: DashboardData['gewicht'];
  ziele: DashboardData['ziele'];
}

export default function WeekCard({ woche, gewicht, ziele }: Props) {
  const bilanzColor = woche.bilanz <= 0 ? 'var(--accent)' : woche.bilanz > 2000 ? 'var(--danger)' : 'var(--text)';
  const bilanzText = woche.bilanz <= 0 ? `${Math.abs(woche.bilanz).toLocaleString('de-DE')} Defizit` : `${woche.bilanz.toLocaleString('de-DE')} Überschuss`;

  return (
    <section className="card">
      <div className="row-between" style={{ marginBottom: 14 }}>
        <div>
          <h3 className="card-title">Letzte 7 Tage</h3>
          <p className="card-subtitle">{woche.geloggteTage} von 7 Tagen geloggt</p>
        </div>
        <span className="badge badge-accent" title="Tage in Folge geloggt">
          <Icon name="flame" size={13} filled /> {woche.streak}
        </span>
      </div>

      <div className="grid-4" style={{ marginBottom: 14 }}>
        <Stat value={woche.avgKcal.toLocaleString('de-DE')} label="Ø kcal" size="sm" />
        <Stat value={`${woche.avgProtein} g`} label="Ø Protein" size="sm" />
        <Stat value={bilanzText.split(' ')[0]} label={bilanzText.split(' ')[1]} size="sm" color={bilanzColor} />
        <Stat
          value={gewicht ? `${gewicht.wert.toLocaleString('de-DE', { maximumFractionDigits: 1 })}` : '–'}
          label={gewicht?.delta7 !== null && gewicht?.delta7 !== undefined ? `${gewicht.delta7 > 0 ? '+' : ''}${gewicht.delta7} kg / 7d` : 'kg'}
          size="sm"
        />
      </div>

      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 40 }}>
        {woche.tage.map((t) => {
          const pct = t.ziel > 0 ? t.kcal / t.ziel : 0;
          const h = t.geloggt ? Math.max(6, Math.min(40, pct * 32)) : 4;
          const color = !t.geloggt ? 'var(--surface-3)' : pct > 1.1 ? 'var(--danger)' : pct >= 0.9 ? 'var(--accent)' : 'var(--text-3)';
          return (
            <div key={t.datum} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${t.datum}: ${Math.round(t.kcal)} / ${Math.round(t.ziel)} kcal`}>
              <div style={{ width: '100%', height: h, borderRadius: 4, background: color, transition: 'height 300ms ease' }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
        {woche.tage.map((t) => {
          const [d, m] = t.datum.split('.').map(Number);
          const wd = new Date(new Date().getFullYear(), m - 1, d).toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2);
          return <div key={t.datum} className="tiny faint" style={{ flex: 1, textAlign: 'center' }}>{wd}</div>;
        })}
      </div>
      <p className="tiny faint" style={{ marginTop: 10 }}>
        Bilanz gegen {ziele.tdee.toLocaleString('de-DE')} kcal Verbrauch plus Sport, nur geloggte Tage. Insgesamt {woche.totalDays} aktive Tage.
      </p>
    </section>
  );
}
