'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import Page, { Loading } from "../components/ui/Page";
import Sheet from "../components/ui/Sheet";
import Button from "../components/ui/Button";
import Icon from "../components/ui/Icon";
import { Field, Input, Select } from "../components/ui/Field";
import { useToast } from "../components/ui/Toast";
import FoodSheet from "../components/FoodSheet";
import { macroColor } from "../utils/colors";
import { todayISO } from "../lib/date";
import type { Zutat } from "./api/zutaten";
import type { GeneratedRecipe } from "./api/rezept-generator";
import type { FoodPrefill } from "../types/dashboard";

const KATEGORIEN = ['Proteine', 'Gemüse', 'Obst', 'Kohlenhydrate', 'Milchprodukte', 'Fette & Öle', 'Gewürze', 'Sonstiges'];
const EINHEITEN = ['g', 'ml', 'Stück', 'EL', 'TL', 'Prise', 'Dose', 'Packung', 'Scheiben', 'Zehen'];
const STILE = [
  { value: 'ausgewogen', label: 'Ausgewogen' },
  { value: 'high-protein', label: 'High Protein' },
  { value: 'low-carb', label: 'Low Carb' },
  { value: 'vegetarisch', label: 'Vegetarisch' },
  { value: 'schnell', label: 'Schnell & einfach' },
];

export default function KuehlschrankSeite() {
  const toast = useToast();
  const [zutaten, setZutaten] = useState<Zutat[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [search, setSearch] = useState('');
  const [kategorie, setKategorie] = useState('Alle');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKat, setNewKat] = useState('Sonstiges');
  const [newEinheit, setNewEinheit] = useState('g');
  const [zielKalorien, setZielKalorien] = useState('');
  const [maxZeit, setMaxZeit] = useState(30);
  const [stil, setStil] = useState('ausgewogen');
  const [prefill, setPrefill] = useState<FoodPrefill | null>(null);
  const [showFood, setShowFood] = useState(false);
  const recipeRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/zutaten').then((r) => r.json()).then((d) => { if (Array.isArray(d)) setZutaten(d); setLoading(false); }).catch(() => { toast.error('Zutaten konnten nicht geladen werden'); setLoading(false); });
  }, [toast]);

  const persist = (list: Zutat[]) => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        const res = await fetch('/api/zutaten', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zutaten: list }) });
        if (!res.ok) throw new Error();
      } catch {
        toast.error('Speichern fehlgeschlagen');
      }
    }, 500);
  };

  const update = (name: string, patch: Partial<Zutat>) => {
    setZutaten((prev) => {
      const next = prev.map((z) => (z.name === name ? { ...z, ...patch } : z));
      persist(next);
      return next;
    });
  };

  const removeZutat = (name: string) => {
    setZutaten((prev) => { const next = prev.filter((z) => z.name !== name); persist(next); return next; });
  };

  const addZutat = () => {
    const name = newName.trim();
    if (!name) return toast.error('Name fehlt');
    if (zutaten.some((z) => z.name.toLowerCase() === name.toLowerCase())) return toast.error('Gibt es schon');
    const next = [...zutaten, { name, kategorie: newKat, verfügbar: true, menge: '', einheit: newEinheit }];
    setZutaten(next);
    persist(next);
    setNewName(''); setNewKat('Sonstiges'); setNewEinheit('g');
    setShowAdd(false);
    toast.success(`${name} hinzugefügt`);
  };

  const generate = async () => {
    const avail = zutaten.filter((z) => z.verfügbar);
    if (avail.length < 2) return toast.error('Mindestens 2 Zutaten markieren');
    setGenerating(true);
    try {
      const res = await fetch('/api/rezept-generator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verfügbareZutaten: avail, präferenzen: { zielKalorien: zielKalorien ? Number(zielKalorien) : null, maxZeit, stil } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRecipe(data);
      setTimeout(() => recipeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch {
      toast.error('Rezept konnte nicht erstellt werden');
    }
    setGenerating(false);
  };

  const logRecipe = (r: GeneratedRecipe) => {
    setPrefill({ name: r.name, kcal: r.nährwerte.kcal, eiweiss: r.nährwerte.protein, fett: r.nährwerte.fett, kh: r.nährwerte.kohlenhydrate, menge: 1, unit: 'Portion', unitWeight: 100 });
    setShowFood(true);
  };

  const kategorien = useMemo(() => ['Alle', ...Array.from(new Set(zutaten.map((z) => z.kategorie)))], [zutaten]);
  const filtered = zutaten.filter((z) =>
    (kategorie === 'Alle' || z.kategorie === kategorie) &&
    z.name.toLowerCase().includes(search.toLowerCase()) &&
    (!onlyAvailable || z.verfügbar),
  );
  const available = zutaten.filter((z) => z.verfügbar);

  if (loading) return <Page title="Rezepte"><Loading text="Lade Kühlschrank…" /></Page>;

  return (
    <Page title="Rezepte" subtitle="Aus dem, was gerade da ist" right={<Button variant="secondary" size="sm" icon="plus" iconOnly onClick={() => setShowAdd(true)} aria-label="Zutat hinzufügen" />}>
      <div className="stack">
        <section className="card">
          <div className="row-between" style={{ marginBottom: 10 }}>
            <div>
              <h3 className="card-title">Verfügbar</h3>
              <p className="card-subtitle">{available.length} von {zutaten.length} Zutaten markiert</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowPrefs((v) => !v)}>
              <Icon name="settings" size={15} /> {STILE.find((s) => s.value === stil)?.label} · {maxZeit} min
            </button>
          </div>

          {available.length > 0 ? (
            <div className="chip-row" style={{ marginBottom: 12 }}>
              {available.map((z) => (
                <button key={z.name} className="chip active" onClick={() => update(z.name, { verfügbar: false })} title="Entfernen">
                  {z.name}{z.menge ? ` · ${z.menge} ${z.einheit}` : ''} <Icon name="x" size={12} />
                </button>
              ))}
            </div>
          ) : (
            <p className="small faint" style={{ marginBottom: 12 }}>Unten Zutaten antippen, die du zu Hause hast.</p>
          )}

          {showPrefs && (
            <div className="card-flat stack" style={{ marginBottom: 12, gap: 12 }}>
              <Field label="Stil">
                <Select value={stil} onChange={(e) => setStil(e.target.value)}>{STILE.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
              </Field>
              <div className="grid-2">
                <Field label="Zielkalorien pro Portion">
                  <Input value={zielKalorien} onChange={(e) => setZielKalorien(e.target.value)} inputMode="numeric" placeholder="flexibel" suffix="kcal" />
                </Field>
                <Field label={`Max. Zeit: ${maxZeit} min`}>
                  <input type="range" className="range" min={10} max={90} step={5} value={maxZeit} onChange={(e) => setMaxZeit(Number(e.target.value))} style={{ margin: '18px 0' }} />
                </Field>
              </div>
            </div>
          )}

          <Button variant="primary" size="lg" block icon="chefHat" onClick={generate} loading={generating} disabled={available.length < 2}>
            {generating ? 'Kocht Ideen…' : 'Rezept generieren'}
          </Button>
        </section>

        {recipe && (
          <section className="card" ref={recipeRef}>
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <h3 className="card-title" style={{ fontSize: 18 }}>{recipe.name}</h3>
                <div className="row small faint" style={{ gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  <span className="row" style={{ gap: 4 }}><Icon name="clock" size={13} />{recipe.zubereitungszeit} min</span>
                  <span>{recipe.portionen} {recipe.portionen === 1 ? 'Portion' : 'Portionen'}</span>
                  <span>{recipe.schwierigkeit}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRecipe(null)} aria-label="Schließen"><Icon name="x" size={16} /></button>
            </div>

            <div className="grid-4" style={{ marginTop: 12 }}>
              {[
                { l: 'kcal', v: recipe.nährwerte.kcal, c: macroColor.kcal, u: '' },
                { l: 'Protein', v: recipe.nährwerte.protein, c: macroColor.protein, u: 'g' },
                { l: 'Carbs', v: recipe.nährwerte.kohlenhydrate, c: macroColor.carbs, u: 'g' },
                { l: 'Fett', v: recipe.nährwerte.fett, c: macroColor.fat, u: 'g' },
              ].map((m) => (
                <div key={m.l} className="card-flat" style={{ padding: '8px 6px', textAlign: 'center' }}>
                  <div className="num" style={{ fontWeight: 700, color: m.c }}>{Math.round(m.v)}{m.u}</div>
                  <div className="tiny faint">{m.l}</div>
                </div>
              ))}
            </div>
            <p className="tiny faint" style={{ marginTop: 6 }}>Nährwerte pro Portion</p>

            <div className="section-label" style={{ marginTop: 16 }}>Zutaten</div>
            <div className="list">
              {recipe.zutaten.map((z, i) => (
                <div key={i} className="list-item" style={{ padding: '8px 0' }}>
                  <span className="num small" style={{ width: 80, color: 'var(--text-2)' }}>{z.menge} {z.einheit}</span>
                  <span className="small">{z.name}</span>
                </div>
              ))}
            </div>

            <div className="section-label" style={{ marginTop: 16 }}>Zubereitung</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none' }} className="stack">
              {recipe.anleitung.map((s, i) => (
                <li key={i} className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <span className="badge badge-accent" style={{ width: 24, padding: 0, justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <span className="small muted" style={{ lineHeight: 1.55 }}>{s.replace(/^Schritt \d+:\s*/i, '')}</span>
                </li>
              ))}
            </ol>

            <Button variant="secondary" block icon="plus" style={{ marginTop: 16 }} onClick={() => logRecipe(recipe)}>Eine Portion eintragen</Button>
          </section>
        )}

        <div className="row">
          <Input prefixIcon="search" placeholder="Zutat suchen…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="chip-row">
          <button className={`chip ${onlyAvailable ? 'active' : ''}`} onClick={() => setOnlyAvailable((v) => !v)}><Icon name="check" size={13} /> Nur verfügbare</button>
          {kategorien.map((k) => (
            <button key={k} className={`chip ${kategorie === k ? 'active' : ''}`} onClick={() => setKategorie(k)}>{k}</button>
          ))}
        </div>

        <section className="card" style={{ padding: '4px 16px' }}>
          {filtered.length === 0 ? (
            <div className="empty">Keine Zutaten gefunden</div>
          ) : (
            <div className="list">
              {filtered.map((z) => (
                <div key={z.name} className="list-item" style={{ padding: '10px 0' }}>
                  <button
                    className={`toggle ${z.verfügbar ? 'on' : ''}`}
                    onClick={() => update(z.name, { verfügbar: !z.verfügbar })}
                    aria-label={z.verfügbar ? 'Als nicht verfügbar markieren' : 'Als verfügbar markieren'}
                    style={{ padding: 0 }}
                  />
                  <div className="list-item-main">
                    <div className="list-item-title" style={{ color: z.verfügbar ? 'var(--text)' : 'var(--text-2)' }}>{z.name}</div>
                    <div className="list-item-sub">{z.kategorie}</div>
                  </div>
                  <div style={{ width: 96, flexShrink: 0 }}>
                    <Input small className="input-center" value={z.menge || ''} placeholder="–" suffix={z.einheit} onChange={(e) => setZutaten((prev) => prev.map((x) => (x.name === z.name ? { ...x, menge: e.target.value } : x)))} onBlur={() => persist(zutaten)} inputMode="decimal" />
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeZutat(z.name)} aria-label="Zutat löschen" style={{ color: 'var(--text-3)' }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Neue Zutat" footer={<Button variant="primary" size="lg" block icon="check" onClick={addZutat}>Hinzufügen</Button>}>
        <div className="stack" style={{ gap: 14 }}>
          <Field label="Name"><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="z. B. Quinoa" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') addZutat(); }} /></Field>
          <div className="grid-2">
            <Field label="Kategorie"><Select value={newKat} onChange={(e) => setNewKat(e.target.value)}>{KATEGORIEN.map((k) => <option key={k}>{k}</option>)}</Select></Field>
            <Field label="Einheit"><Select value={newEinheit} onChange={(e) => setNewEinheit(e.target.value)}>{EINHEITEN.map((k) => <option key={k}>{k}</option>)}</Select></Field>
          </div>
        </div>
      </Sheet>

      <FoodSheet open={showFood} onClose={() => setShowFood(false)} onSaved={() => {}} date={todayISO()} prefill={prefill} />
    </Page>
  );
}
