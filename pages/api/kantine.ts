import type { NextApiRequest, NextApiResponse } from 'next';

const FIREBASE_API_KEY = 'AIzaSyBHkiXldYfl7MbmQgheUbi2lcEh1IDr6OA';
const FIREBASE_REFRESH_TOKEN =
  'AMf-vBw-9hWRGdxj7kFMJ-_TmHDIWwX6Wzm5vofP-NMderG21Zd29n8smDaIIFCOe2HQKiKI-B8Dpp8BiXE1GL3TDVzPZ17hJxHrRkmNg0GiEcXDJKuf6M4DWrbCWIvc0SrsJBlD_j2Cl10WLMN4upvkW5L2d5_FsTB_omB59hrrVlg8mLnbpbg';
const MENU_ID = '16771';
const FIREBASE_PROJECT = 'qnips-sodexo-germany';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string | number }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | { arrayValue: { values?: FirestoreValue[] } }
  | { mapValue: { fields?: Record<string, FirestoreValue> } };

function unwrap(v: FirestoreValue): unknown {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(unwrap);
  if ('mapValue' in v) {
    const out: Record<string, unknown> = {};
    for (const [k, vv] of Object.entries(v.mapValue.fields || {})) out[k] = unwrap(vv);
    return out;
  }
  return null;
}

function isoYearWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week };
}

type Cached<T> = { data: T; expiresAt: number };
let idTokenCache: Cached<string> | null = null;
const menuCache: Map<string, Cached<unknown>> = new Map();

async function getIdToken(): Promise<string> {
  if (idTokenCache && Date.now() < idTokenCache.expiresAt) return idTokenCache.data;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: FIREBASE_REFRESH_TOKEN,
  });
  const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as { id_token: string; expires_in: string };
  const ttlMs = Math.max(60_000, (parseInt(j.expires_in, 10) - 120) * 1000);
  idTokenCache = { data: j.id_token, expiresAt: Date.now() + ttlMs };
  return j.id_token;
}

type Dish = {
  id: number;
  category: string;
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
  gewicht: number;
  preis: number;
};

async function fetchWeek(year: number, week: number): Promise<Record<string, unknown>> {
  const weekKey = `${year}-${week}`;
  const cached = menuCache.get(weekKey);
  if (cached && Date.now() < cached.expiresAt) return cached.data as Record<string, unknown>;

  const token = await getIdToken();
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/Release/de-DE/Menus/${MENU_ID}/Years/${year}/Weeks/${week}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Firestore fetch failed: ${r.status} ${await r.text()}`);
  const raw = (await r.json()) as { fields?: Record<string, FirestoreValue> };
  const flat: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw.fields || {})) flat[k] = unwrap(v);
  menuCache.set(weekKey, { data: flat, expiresAt: Date.now() + 6 * 3600 * 1000 });
  return flat;
}

function extractDishesForDate(weekData: Record<string, unknown>, date: Date): Dish[] {
  const jsDay = date.getDay();
  const targetDow = (jsDay + 6) % 7;
  const days = (weekData.Days as Array<Record<string, unknown>> | undefined) || [];
  const today = days.find((d) => d.WeekDay === targetDow);
  if (!today) return [];

  const dishes: Dish[] = [];
  const categories = (today.Categories as Array<Record<string, unknown>> | undefined) || [];
  for (const cat of categories) {
    const categoryName = (cat.Name as string) || '';
    const products = (cat.Products as Array<Record<string, unknown>> | undefined) || [];
    for (const p of products) {
      const nf = (p.NutritionFacts as Record<string, number> | undefined) || {};
      const prices = (p.Prices as Array<{ Price?: number }> | undefined) || [];
      const rawName = (p.Name as string) || '';
      const name = rawName.replace(/\s*\n+\s*/g, ' | ').trim();
      if (!name) continue;
      dishes.push({
        id: (p.Id as number) || 0,
        category: categoryName,
        name,
        kcal: Math.round((nf.KCalPer100 || 0) * 10) / 10,
        eiweiss: Math.round((nf.ProteinsPer100 || 0) * 10) / 10,
        fett: Math.round((nf.FatsPer100 || 0) * 10) / 10,
        kh: Math.round((nf.CarbsPer100 || 0) * 10) / 10,
        gewicht: (p.WeightInGrams as number) || 0,
        preis: prices[0]?.Price || 0,
      });
    }
  }
  return dishes;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const dateStr =
      (typeof req.query.date === 'string' && req.query.date) ||
      new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
    const date = new Date(`${dateStr}T12:00:00+02:00`);
    if (isNaN(date.getTime())) return res.status(400).json({ error: 'invalid date' });

    const { year, week } = isoYearWeek(date);
    const weekData = await fetchWeek(year, week);
    const dishes = extractDishesForDate(weekData, date);
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=21600');
    return res.status(200).json({ date: dateStr, year, week, dishes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  }
}
