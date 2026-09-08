import type { sheets_v4 } from "googleapis";
import { SHEET_ID, num } from "./sheets";
import { normalizeDE, parseDE, todayDE, isoToDE } from "./date";

export type Unit = 'g' | 'ml' | 'Stück' | 'Portion';

export interface FoodEntry {
  row: number;
  datum: string;
  zeit: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  menge: number | null;
  unit: Unit | null;
  unitWeight: number | null;
}

export interface ActivityEntry {
  row: number;
  datum: string;
  zeit: string;
  name: string;
  kcal: number;
}

export interface WeightEntry {
  row: number;
  datum: string;
  gewicht: number;
  fett: number | null;
  muskel: number | null;
  wasser: number | null;
}

export interface Ziele {
  kcal: number;
  kh: number;
  eiweiss: number;
  fett: number;
  startgewicht: number;
  zielGewicht: number | null;
  tdee: number;
}

export interface TrackingData {
  ziele: Ziele;
  food: FoodEntry[];
  activities: ActivityEntry[];
  weights: WeightEntry[];
}

function toUnit(v: unknown): Unit | null {
  if (v === 'g' || v === 'ml' || v === 'Stück' || v === 'Portion') return v;
  return null;
}

export async function loadTracking(sheets: sheets_v4.Sheets): Promise<TrackingData> {
  const id = SHEET_ID();
  const [zieleRes, foodRes, aktRes, gewRes] = await Promise.all([
    sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Ziele!A2:G2" }),
    sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Tabelle1!A:J" }),
    sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Aktivitäten!A:D" }),
    sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Gewicht!A:E" }).catch(() => ({ data: { values: [] as string[][] } })),
  ]);

  const z = zieleRes.data.values?.[0] || [];
  const ziele: Ziele = {
    kcal: num(z[0]) || 2200,
    kh: num(z[1]) || 250,
    eiweiss: num(z[2]) || 130,
    fett: num(z[3]) || 70,
    startgewicht: num(z[4]) || 0,
    zielGewicht: z[5] ? num(z[5]) : null,
    tdee: num(z[6]) || 2600,
  };

  const food: FoodEntry[] = [];
  (foodRes.data.values || []).forEach((r, i) => {
    if (i === 0) return; // header
    if (!r[0] || !parseDE(String(r[0]))) return;
    food.push({
      row: i + 1,
      datum: normalizeDE(String(r[0])),
      zeit: r[1] ? String(r[1]) : '',
      name: r[2] ? String(r[2]) : '',
      kcal: num(r[3]),
      eiweiss: num(r[4]),
      fett: num(r[5]),
      kh: num(r[6]),
      menge: r[7] !== undefined && r[7] !== '' ? num(r[7]) : null,
      unit: toUnit(r[8]),
      unitWeight: r[9] !== undefined && r[9] !== '' ? num(r[9]) : null,
    });
  });

  const activities: ActivityEntry[] = [];
  (aktRes.data.values || []).forEach((r, i) => {
    if (i === 0) return;
    if (!r[0] || !parseDE(String(r[0]))) return;
    activities.push({
      row: i + 1,
      datum: normalizeDE(String(r[0])),
      name: r[1] ? String(r[1]) : '',
      kcal: num(r[2]),
      zeit: r[3] ? String(r[3]) : '',
    });
  });

  const weights: WeightEntry[] = [];
  (gewRes.data.values || []).forEach((r, i) => {
    if (i === 0) return;
    if (!r[0] || !parseDE(String(r[0]))) return;
    const g = num(r[1]);
    if (!g) return;
    weights.push({
      row: i + 1,
      datum: normalizeDE(String(r[0])),
      gewicht: g,
      fett: r[2] ? num(r[2]) : null,
      muskel: r[3] ? num(r[3]) : null,
      wasser: r[4] ? num(r[4]) : null,
    });
  });

  return { ziele, food, activities, weights };
}

export interface DaySummary {
  datum: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  aktivitaet: number;
  zielKcal: number;
  zielEiweiss: number;
  zielFett: number;
  zielKh: number;
  eintraege: FoodEntry[];
  aktivitaeten: ActivityEntry[];
}

export function summarizeDay(data: TrackingData, datumDE: string): DaySummary {
  const key = normalizeDE(datumDE);
  const eintraege = data.food.filter((f) => f.datum === key);
  const aktivitaeten = data.activities.filter((a) => a.datum === key);
  const aktivitaet = aktivitaeten.reduce((s, a) => s + a.kcal, 0);
  const { ziele } = data;
  const faktor = ziele.kcal > 0 ? (ziele.kcal + aktivitaet) / ziele.kcal : 1;
  return {
    datum: key,
    kcal: eintraege.reduce((s, e) => s + e.kcal, 0),
    eiweiss: eintraege.reduce((s, e) => s + e.eiweiss, 0),
    fett: eintraege.reduce((s, e) => s + e.fett, 0),
    kh: eintraege.reduce((s, e) => s + e.kh, 0),
    aktivitaet,
    zielKcal: ziele.kcal + aktivitaet,
    zielEiweiss: Math.round(ziele.eiweiss * faktor),
    zielFett: Math.round(ziele.fett * faktor),
    zielKh: Math.round(ziele.kh * faktor),
    eintraege,
    aktivitaeten,
  };
}

export function dateKeyForISO(iso?: string | null): string {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) return normalizeDE(isoToDE(iso));
  return normalizeDE(todayDE());
}
