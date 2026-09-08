'use client';

import { useEffect, useState } from "react";
import Page from "../components/ui/Page";
import Icon from "../components/ui/Icon";
import Button from "../components/ui/Button";
import { Segmented, Toggle } from "../components/ui/Field";
import { useToast } from "../components/ui/Toast";
import FoodSheet from "../components/FoodSheet";
import { macroColor } from "../utils/colors";
import type { FoodPrefill } from "../types/dashboard";
import { todayISO } from "../lib/date";

interface Vorschlag {
  gericht: string;
  zutaten: string[];
  rezept: string;
  makros: { kcal: number; eiweiss: number; fett: number; kh: number };
  preis?: string;
  zeit?: number;
}
interface Tag { tag: string; gerichte: Vorschlag[] }
interface Kontext {
  zielKcal: number; gegessen: number; restKcal: number; restProtein: number; restKh: number; restFett: number; budgetKcal: number; zutaten: string[];
}
interface Result { kontext: Kontext; vorschlaege?: Vorschlag[]; tage?: Tag[] }

const MEALS = [
  { name: 'Frühstück', icon: 'sun' as const },
  { name: 'Mittagessen', icon: 'utensils' as const },
  { name: 'Abendessen', icon: 'moon' as const },
  { name: 'Snack', icon: 'apple' as const },
];

export default function EmpfehlungTab() {
  const toast = useToast();
  const [stil, setStil] = useState<"vegetarisch" | "alles">("alles");
  const [kalorienProzent, setKalorienProzent] = useState(100);
  const [essensarten, setEssensarten] = useState<string[]>([]);
  const [budget, setBudget] = useState(false);
  const [zeit, setZeit] = useState(30);
  const [wochenplan, setWochenplan] = useState(false);
  const [nutzeKuehlschrank, setNutzeKuehlschrank] = useState(false);
  const [zutatenCount, setZutatenCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [prefill, setPrefill] = useState<FoodPrefill | null>(null);
  const [showFood, setShowFood] = useState(false);
  const [kontext, setKontext] = useState<{ restKcal: number; restProtein: number; zielKcal: number } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then((d) => {
      if (d?.tag) setKontext({ restKcal: Math.round(d.tag.zielKcal - d.tag.kcal), restProtein: Math.round(d.tag.zielEiweiss - d.tag.eiweiss), zielKcal: d.tag.zielKcal });
    }).catch(() => {});
    fetch('/api/zutaten').then((r) => r.json()).then((z) => { if (Array.isArray(z)) setZutatenCount(z.filter((x) => x.verfügbar).length); }).catch(() => {});
  }, []);

  const toggleMeal = (m: string) => setEssensarten((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const laden = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/essensvorschlag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stil, kalorienProzent, essensarten, budget, zeit, wochenplan, nutzeKuehlschrank }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch {
      toast.error('Empfehlung konnte nicht erstellt werden');
    }
    setLoading(false);
  };

  const eintragen = (v: Vorschlag) => {
    setPrefill({ name: v.gericht, kcal: v.makros.kcal, eiweiss: v.makros.eiweiss, fett: v.makros.fett, kh: v.makros.kh, menge: 1, unit: 'Portion', unitWeight: 100 });
    setShowFood(true);
  };

  const basis = wochenplan || !kontext || kontext.restKcal <= 150 ? kontext?.zielKcal || 0 : kontext.restKcal;

  return (
    <Page title="Ideen" subtitle="Vorschläge passend zu deinem Restbudget">
      <div className="stack">
        {kontext && (
          <div className="card-flat row-between">
            <div>
              <div className="tiny faint">Heute noch übrig</div>
              <div className="num" style={{ fontWeight: 700, fontSize: 18, color: kontext.restKcal < 0 ? 'var(--danger)' : 'var(--text)' }}>
                {kontext.restKcal.toLocaleString('de-DE')} kcal
                <span className="small" style={{ color: macroColor.protein, fontWeight: 500 }}> · {kontext.restProtein} g Protein</span>
              </div>
            </div>
            {kontext.restKcal <= 150 && !wochenplan && <span className="badge badge-warning">Basis: Tagesziel</span>}
          </div>
        )}

        <section className="card stack" style={{ gap: 16 }}>
          <Toggle on={wochenplan} onChange={setWochenplan} label="Ganze Woche planen" sub="7 Tage, Zutaten werden über die Woche verteilt" />
          <Toggle
            on={nutzeKuehlschrank}
            onChange={setNutzeKuehlschrank}
            label="Kühlschrank-Zutaten verwenden"
            sub={zutatenCount === null ? 'Lädt…' : zutatenCount === 0 ? 'Keine Zutaten als verfügbar markiert' : `${zutatenCount} verfügbare Zutaten`}
          />
        </section>

        <section className="card stack" style={{ gap: 16 }}>
          <div>
            <div className="section-label">Ernährungsstil</div>
            <Segmented value={stil} onChange={setStil} options={[{ value: 'alles', label: 'Alles', icon: 'layers' }, { value: 'vegetarisch', label: 'Vegetarisch', icon: 'leaf' }]} />
          </div>

          <div>
            <div className="section-label">Mahlzeiten</div>
            <div className="grid-4" style={{ gap: 8 }}>
              {MEALS.map((m) => {
                const active = essensarten.includes(m.name);
                return (
                  <button key={m.name} className={`chip ${active ? 'active' : ''}`} onClick={() => toggleMeal(m.name)} style={{ flexDirection: 'column', height: 60, gap: 4, padding: 0, borderRadius: 12, fontSize: 11 }}>
                    <Icon name={m.icon} size={18} />
                    {m.name === 'Mittagessen' ? 'Mittag' : m.name === 'Abendessen' ? 'Abend' : m.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="row-between">
              <span className="section-label" style={{ marginBottom: 0 }}>{wochenplan ? 'Anteil vom Tagesziel' : 'Anteil vom Restbudget'}</span>
              <span className="num small" style={{ fontWeight: 600 }}>{kalorienProzent} % ≈ {Math.round(basis * kalorienProzent / 100)} kcal</span>
            </div>
            <input type="range" className="range" min={10} max={100} step={5} value={kalorienProzent} onChange={(e) => setKalorienProzent(Number(e.target.value))} />
          </div>

          <div>
            <div className="row-between">
              <span className="section-label" style={{ marginBottom: 0 }}>Max. Zubereitungszeit</span>
              <span className="num small" style={{ fontWeight: 600 }}>{zeit} min</span>
            </div>
            <input type="range" className="range" min={5} max={90} step={5} value={zeit} onChange={(e) => setZeit(Number(e.target.value))} />
          </div>

          <Toggle on={budget} onChange={setBudget} label="Budget-freundlich" sub="Günstige Zutaten bevorzugen" />
        </section>

        <Button variant="primary" size="lg" block icon="sparkles" onClick={laden} loading={loading}>
          {loading ? 'Denkt nach…' : wochenplan ? 'Wochenplan erstellen' : 'Vorschläge holen'}
        </Button>

        {result?.vorschlaege && (
          <div className="stack">
            <div className="section-label">Vorschläge für heute · je ca. {result.kontext.budgetKcal} kcal</div>
            {result.vorschlaege.map((v, i) => <RecipeCard key={i} v={v} onLog={() => eintragen(v)} />)}
          </div>
        )}

        {result?.tage && (
          <div className="stack">
            <div className="section-label">Wochenplan</div>
            {result.tage.map((t) => (
              <div key={t.tag}>
                <h3 className="card-title" style={{ margin: '6px 0 8px' }}>{t.tag}</h3>
                <div className="stack">{t.gerichte.map((v, i) => <RecipeCard key={i} v={v} onLog={() => eintragen(v)} />)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <FoodSheet open={showFood} onClose={() => setShowFood(false)} onSaved={() => {}} date={todayISO()} prefill={prefill} />
    </Page>
  );
}

function RecipeCard({ v, onLog }: { v: Vorschlag; onLog: () => void }) {
  const [openRecipe, setOpenRecipe] = useState(false);
  return (
    <div className="card">
      <div className="row-between" style={{ alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h3 className="card-title" style={{ fontSize: 16 }}>{v.gericht}</h3>
          <div className="row small faint" style={{ marginTop: 4, gap: 10, flexWrap: 'wrap' }}>
            {v.zeit ? <span className="row" style={{ gap: 4 }}><Icon name="clock" size={13} />{v.zeit} min</span> : null}
            {v.preis && <span className="row" style={{ gap: 4 }}><Icon name="euro" size={13} />{v.preis.replace('ca. ', '')}</span>}
          </div>
        </div>
        <Button size="sm" variant="secondary" icon="plus" onClick={onLog}>Eintragen</Button>
      </div>

      <div className="grid-4" style={{ marginTop: 12 }}>
        <MacroCell label="kcal" value={v.makros.kcal} color={macroColor.kcal} />
        <MacroCell label="Protein" value={v.makros.eiweiss} color={macroColor.protein} unit="g" />
        <MacroCell label="Carbs" value={v.makros.kh} color={macroColor.carbs} unit="g" />
        <MacroCell label="Fett" value={v.makros.fett} color={macroColor.fat} unit="g" />
      </div>

      <p className="small muted" style={{ marginTop: 12 }}>{v.zutaten.join(' · ')}</p>
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 6, padding: 0, height: 28 }} onClick={() => setOpenRecipe((o) => !o)}>
        <Icon name={openRecipe ? 'chevronUp' : 'chevronDown'} size={15} /> Zubereitung
      </button>
      {openRecipe && <p className="small muted" style={{ marginTop: 6, lineHeight: 1.6 }}>{v.rezept}</p>}
    </div>
  );
}

function MacroCell({ label, value, color, unit = '' }: { label: string; value: number; color: string; unit?: string }) {
  return (
    <div className="card-flat" style={{ padding: '8px 6px', textAlign: 'center' }}>
      <div className="num" style={{ fontWeight: 700, color }}>{Math.round(value)}{unit}</div>
      <div className="tiny faint">{label}</div>
    </div>
  );
}
