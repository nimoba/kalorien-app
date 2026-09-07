import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets } from "../../lib/sheets";
import { loadTracking, summarizeDay, dateKeyForISO, FoodEntry } from "../../lib/tracking";
import { normalizeDE, parseDE, todayDE, deToISO } from "../../lib/date";

function actualGrams(e: FoodEntry): number | null {
  if (e.menge === null || e.unit === null) return null;
  if (e.unit === 'g' || e.unit === 'ml') return e.menge;
  if (e.unitWeight) return e.menge * e.unitWeight;
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sheets = getSheets(true);
    const data = await loadTracking(sheets);
    const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;
    const key = dateKeyForISO(dateParam);
    const todayKey = normalizeDE(todayDE());

    const tag = summarizeDay(data, key);

    // Recent unique foods (most recent first), pre-computed as per-100g base values
    const seen = new Set<string>();
    const recent: {
      name: string; kcal: number; eiweiss: number; fett: number; kh: number;
      menge: number; unit: string; unitWeight: number | null;
    }[] = [];
    for (let i = data.food.length - 1; i >= 0 && recent.length < 10; i--) {
      const e = data.food[i];
      const n = e.name.trim().toLowerCase();
      if (!n || seen.has(n)) continue;
      seen.add(n);
      const grams = actualGrams(e);
      if (grams && grams > 0) {
        const f = 100 / grams;
        recent.push({
          name: e.name, kcal: e.kcal * f, eiweiss: e.eiweiss * f, fett: e.fett * f, kh: e.kh * f,
          menge: e.menge as number, unit: e.unit as string, unitWeight: e.unitWeight,
        });
      } else {
        // Legacy rows without amount info: treat as one 100 g portion so the totals stay identical
        recent.push({ name: e.name, kcal: e.kcal, eiweiss: e.eiweiss, fett: e.fett, kh: e.kh, menge: 1, unit: 'Portion', unitWeight: 100 });
      }
    }

    // Last 7 calendar days ending today
    const today = parseDE(todayKey) as Date;
    const last7: string[] = [];
    for (let d = 6; d >= 0; d--) {
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
      last7.push(`${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`);
    }
    const daySummaries = last7.map((k) => summarizeDay(data, k));
    const logged = daySummaries.filter((d) => d.eintraege.length > 0);
    const avgKcal = logged.length ? Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length) : 0;
    const avgProtein = logged.length ? Math.round(logged.reduce((s, d) => s + d.eiweiss, 0) / logged.length) : 0;
    const bilanz = Math.round(logged.reduce((s, d) => s + (d.kcal - (data.ziele.tdee + d.aktivitaet)), 0));

    // Streak: consecutive days with food entries, ending today (or yesterday if today is still empty)
    const foodDays = new Set(data.food.map((f) => f.datum));
    let streak = 0;
    let cursor = new Date(today);
    if (!foodDays.has(todayKey)) cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    while (foodDays.has(`${cursor.getDate()}.${cursor.getMonth() + 1}.${cursor.getFullYear()}`)) {
      streak++;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }
    const totalDays = new Set([...data.food.map((f) => f.datum), ...data.weights.map((w) => w.datum)]).size;

    // Weight: latest and change vs. entry ~7 days earlier
    const weightsSorted = [...data.weights].sort((a, b) => (parseDE(a.datum)?.getTime() || 0) - (parseDE(b.datum)?.getTime() || 0));
    const latest = weightsSorted[weightsSorted.length - 1] || null;
    let delta7: number | null = null;
    if (latest) {
      const latestTime = parseDE(latest.datum)?.getTime() || 0;
      const weekAgo = latestTime - 7 * 86400000;
      const ref = [...weightsSorted].reverse().find((w) => (parseDE(w.datum)?.getTime() || 0) <= weekAgo);
      if (ref) delta7 = Math.round((latest.gewicht - ref.gewicht) * 10) / 10;
    }

    res.status(200).json({
      date: deToISO(key),
      isToday: key === todayKey,
      ziele: data.ziele,
      tag: {
        ...tag,
        eintraege: tag.eintraege.map((e) => ({ ...e })),
      },
      recent,
      woche: {
        avgKcal,
        avgProtein,
        bilanz,
        geloggteTage: logged.length,
        streak,
        totalDays,
        tage: daySummaries.map((d) => ({ datum: d.datum, kcal: d.kcal, ziel: d.zielKcal, geloggt: d.eintraege.length > 0 })),
      },
      gewicht: latest ? { wert: latest.gewicht, datum: latest.datum, delta7 } : null,
    });
  } catch (err) {
    console.error("Fehler in /api/dashboard:", err);
    res.status(500).json({ error: "Fehler beim Laden des Dashboards" });
  }
}
