import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID, deleteRow, num } from "../../lib/sheets";

// DELETE { sheet: 'essen' | 'sport', row: number, name: string, kcal: number }
// The row content is verified before deleting so a stale row index never removes the wrong entry.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { sheet, row, name, kcal } = req.body || {};
  const rowNum = Number(row);
  if (!['essen', 'sport'].includes(sheet) || !rowNum || rowNum < 2) {
    return res.status(400).json({ error: 'Ungültige Anfrage' });
  }

  const title = sheet === 'essen' ? 'Tabelle1' : 'Aktivitäten';
  const nameCol = sheet === 'essen' ? 2 : 1;
  const kcalCol = sheet === 'essen' ? 3 : 2;

  try {
    const sheets = getSheets();
    const check = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID(),
      range: `${title}!A${rowNum}:G${rowNum}`,
    });
    const r = check.data.values?.[0] || [];
    const sameName = String(r[nameCol] ?? '').trim() === String(name ?? '').trim();
    const sameKcal = Math.abs(num(r[kcalCol]) - num(kcal)) < 0.5;
    if (!sameName || !sameKcal) {
      return res.status(409).json({ error: 'Eintrag hat sich geändert, bitte neu laden' });
    }
    await deleteRow(sheets, title, rowNum);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Fehler beim Löschen:', err);
    res.status(500).json({ error: 'Löschen fehlgeschlagen' });
  }
}
