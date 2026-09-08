import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID, deleteRow, num } from "../../lib/sheets";
import type { FavoritItem } from "../../types/favorit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') return list(res);
  if (req.method === 'POST') return upsert(req, res);
  if (req.method === 'DELETE') return remove(req, res);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function list(res: NextApiResponse) {
  try {
    const sheets = getSheets(true);
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Favoriten!A2:G" });
    const rows = r.data.values || [];
    const favoriten: FavoritItem[] = rows
      .filter((row) => row[0] && row[1])
      .map((row) => ({
        name: String(row[0]),
        kcal: num(row[1]),
        eiweiss: num(row[2]),
        fett: num(row[3]),
        kh: num(row[4]),
        unit: (row[5] as FavoritItem['unit']) || 'g',
        unitWeight: row[6] ? num(row[6]) : undefined,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
    res.status(200).json(favoriten);
  } catch (err) {
    console.error("Fehler beim Laden der Favoriten:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Favoriten" });
  }
}

// Body: per-100g values { name, kcal, eiweiss, fett, kh, unit, unitWeight }
async function upsert(req: NextApiRequest, res: NextApiResponse) {
  const { name, kcal, eiweiss, fett, kh, unit, unitWeight } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name fehlt' });
  try {
    const sheets = getSheets();
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Favoriten!A:A" });
    const rows = r.data.values || [];
    const key = name.trim().toLowerCase();
    const idx = rows.findIndex((row, i) => i > 0 && String(row[0] || '').trim().toLowerCase() === key);
    const values = [[key, num(kcal), num(eiweiss), num(fett), num(kh), unit || 'g', unitWeight ? num(unitWeight) : '']];
    if (idx >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID(), range: `Favoriten!A${idx + 1}:G${idx + 1}`, valueInputOption: "USER_ENTERED", requestBody: { values },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID(), range: "Favoriten!A:G", valueInputOption: "USER_ENTERED", requestBody: { values },
      });
    }
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern des Favoriten:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}

async function remove(req: NextApiRequest, res: NextApiResponse) {
  const { name } = req.body || {};
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'Name fehlt' });
  try {
    const sheets = getSheets();
    const r = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Favoriten!A:A" });
    const rows = r.data.values || [];
    const key = name.trim().toLowerCase();
    const idx = rows.findIndex((row, i) => i > 0 && String(row[0] || '').trim().toLowerCase() === key);
    if (idx < 0) return res.status(404).json({ error: 'Favorit nicht gefunden' });
    await deleteRow(sheets, 'Favoriten', idx + 1);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Löschen des Favoriten:", err);
    res.status(500).json({ error: "Löschen fehlgeschlagen" });
  }
}
