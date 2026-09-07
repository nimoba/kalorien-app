import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets } from "../../lib/sheets";
import { loadTracking, summarizeDay } from "../../lib/tracking";
import { parseDE, todayDE } from "../../lib/date";

// Returns per-day calories vs. goal for the last `days` days (default 30, max 365).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const days = Math.min(365, Math.max(7, parseInt(String(req.query.days || '30'), 10) || 30));
    const sheets = getSheets(true);
    const data = await loadTracking(sheets);

    const today = parseDE(todayDE()) as Date;
    const result: { datum: string; kalorien: number; ziel: number; geloggt: boolean }[] = [];
    for (let d = days - 1; d >= 0; d--) {
      const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
      const key = `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`;
      const s = summarizeDay(data, key);
      result.push({ datum: key, kalorien: Math.round(s.kcal), ziel: Math.round(s.zielKcal), geloggt: s.eintraege.length > 0 });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Fehler in /api/history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Verlaufdaten" });
  }
}
