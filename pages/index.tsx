'use client';

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Page, { ErrorState } from "../components/ui/Page";
import Icon from "../components/ui/Icon";
import KcalHero from "../components/dashboard/KcalHero";
import MacroRow from "../components/dashboard/MacroRow";
import TodayList from "../components/dashboard/TodayList";
import RecentChips from "../components/dashboard/RecentChips";
import WeekCard from "../components/dashboard/WeekCard";
import FabMenu from "../components/dashboard/FabMenu";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";
import KcalBilanzChart from "../components/charts/KcalBilanzChart";
import FoodSheet from "../components/FoodSheet";
import SportForm from "../components/SportForm";
import GewichtForm from "../components/GewichtForm";
import SettingsForm from "../components/SettingsForm";
import FavoritenModal from "../components/FavoritenModal";
import type { FavoritItem } from "../types/favorit";
import type { DashboardData, FoodPrefill, RecentFood, FoodEntry } from "../types/dashboard";
import { todayISO, shiftISO, formatISOLong, formatISOShort } from "../lib/date";

export default function Dashboard() {
  const router = useRouter();
  const [date, setDate] = useState<string>(todayISO());
  const [daten, setDaten] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshCharts, setRefreshCharts] = useState(0);

  const [showFood, setShowFood] = useState(false);
  const [prefill, setPrefill] = useState<FoodPrefill | null>(null);
  const [showSport, setShowSport] = useState(false);
  const [showWeight, setShowWeight] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    setError(false);
    fetch(`/api/dashboard?date=${date}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: DashboardData) => { setDaten(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [date]);

  useEffect(() => { load(); }, [load]);

  const refreshAll = () => {
    load(true);
    setRefreshCharts((v) => v + 1);
  };

  const isToday = date === todayISO();
  const openFood = (p: FoodPrefill | null = null) => { setPrefill(p); setShowFood(true); };

  const pickRecent = (r: RecentFood) => openFood({ ...r });
  const repeatEntry = (e: FoodEntry) => {
    const grams = e.menge !== null && e.unit ? (e.unit === 'g' || e.unit === 'ml' ? e.menge : e.menge * (e.unitWeight || 0)) : 0;
    if (grams > 0 && e.unit && e.menge !== null) {
      const f = 100 / grams;
      openFood({ name: e.name, kcal: e.kcal * f, eiweiss: e.eiweiss * f, fett: e.fett * f, kh: e.kh * f, menge: e.menge, unit: e.unit, unitWeight: e.unitWeight });
    } else {
      openFood({ name: e.name, kcal: e.kcal, eiweiss: e.eiweiss, fett: e.fett, kh: e.kh, menge: 1, unit: 'Portion', unitWeight: 100 });
    }
  };
  const pickFavorite = (item: FavoritItem, menge: number) => {
    setShowFavorites(false);
    openFood({ name: item.name, kcal: item.kcal, eiweiss: item.eiweiss, fett: item.fett, kh: item.kh, menge, unit: item.unit, unitWeight: item.unitWeight ?? null });
  };

  const dateNav = (
    <div className="row" style={{ gap: 4 }}>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDate(shiftISO(date, -1))} aria-label="Vorheriger Tag"><Icon name="chevronLeft" /></button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDate(shiftISO(date, 1))} disabled={isToday} aria-label="Nächster Tag"><Icon name="chevronRight" /></button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowSettings(true)} aria-label="Ziele"><Icon name="settings" /></button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => router.push('/finanzen')} aria-label="Finanzen"><Icon name="wallet" /></button>
    </div>
  );

  return (
    <Page
      title={isToday ? 'Heute' : formatISOShort(date)}
      subtitle={
        isToday ? formatISOLong(date) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setDate(todayISO())} style={{ height: 24, padding: 0, color: 'var(--accent)' }}>
            Zurück zu heute
          </button>
        )
      }
      right={dateNav}
    >
      {error && !daten ? (
        <ErrorState text="Daten konnten nicht geladen werden" onRetry={() => load()} />
      ) : loading && !daten ? (
        <div className="stack">
          <div className="skeleton" style={{ height: 250 }} />
          <div className="grid-3"><div className="skeleton" style={{ height: 96 }} /><div className="skeleton" style={{ height: 96 }} /><div className="skeleton" style={{ height: 96 }} /></div>
          <div className="skeleton" style={{ height: 140 }} />
        </div>
      ) : daten && (
        <div className="stack" style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          <KcalHero gegessen={daten.tag.kcal} ziel={daten.tag.zielKcal} aktivitaet={daten.tag.aktivitaet} basisZiel={daten.ziele.kcal} />
          <MacroRow
            eiweiss={daten.tag.eiweiss} zielEiweiss={daten.tag.zielEiweiss}
            kh={daten.tag.kh} zielKh={daten.tag.zielKh}
            fett={daten.tag.fett} zielFett={daten.tag.zielFett}
          />

          <RecentChips items={daten.recent} onPick={pickRecent} onOpenFavorites={() => setShowFavorites(true)} />

          <div>
            <div className="section-label">{isToday ? 'Heute gegessen' : 'Einträge'}</div>
            <TodayList eintraege={daten.tag.eintraege} aktivitaeten={daten.tag.aktivitaeten} onChanged={refreshAll} onRepeat={repeatEntry} />
          </div>

          <WeekCard woche={daten.woche} gewicht={daten.gewicht} ziele={daten.ziele} />
          <TagesLineChart eintraege={daten.tag.eintraege} ziel={daten.tag.zielKcal} isToday={isToday} />
          <WochenChart refresh={refreshCharts} />
          <KcalBilanzChart refresh={refreshCharts} />
        </div>
      )}

      <FabMenu onFood={() => openFood(null)} onSport={() => setShowSport(true)} onWeight={() => setShowWeight(true)} />

      <FoodSheet open={showFood} onClose={() => setShowFood(false)} onSaved={refreshAll} date={date} prefill={prefill} />
      <SportForm open={showSport} onClose={() => setShowSport(false)} onSaved={refreshAll} date={date} />
      <GewichtForm open={showWeight} onClose={() => setShowWeight(false)} onSaved={refreshAll} date={date} />
      <SettingsForm open={showSettings} onClose={() => setShowSettings(false)} onSaved={refreshAll} />
      <FavoritenModal open={showFavorites} onClose={() => setShowFavorites(false)} onSelect={pickFavorite} />
    </Page>
  );
}
