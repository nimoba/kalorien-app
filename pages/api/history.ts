import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = "Tabelle1!A:D"; // A = Datum, D = Kalorien

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = result.data.values || [];
    const header = rows[0];
    const datenSpalte = header.indexOf("Datum");
    const kcalSpalte = header.indexOf("Kalorien");

    if (datenSpalte === -1 || kcalSpalte === -1) {
      return res.status(400).json({ error: "Spalten nicht gefunden" });
    }

    const today = new Date();
    const datenMap = new Map<string, number>();

    for (const row of rows.slice(1)) {
      const rawDate = row[datenSpalte];
      const kcal = Number(row[kcalSpalte]) || 0;
      if (!rawDate) continue;

      const datum = rawDate.trim();

      // Nur letzten 30 Tage
      const [day, month, year] = datum.split(".");
      const entryDate = new Date(`${year}-${month}-${day}`);
      const diffDays = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDays < 0 || diffDays > 30) continue;

      if (!datenMap.has(datum)) {
        datenMap.set(datum, 0);
      }
      datenMap.set(datum, datenMap.get(datum)! + kcal);
    }

    // Sortiere nach Datum (alt → neu)
    const sorted = Array.from(datenMap.entries())
      .sort(([a], [b]) => {
        const [da, ma, ja] = a.split(".").map(Number);
        const [db, mb, jb] = b.split(".").map(Number);
        return new Date(ja, ma - 1, da).getTime() - new Date(jb, mb - 1, db).getTime();
      })
      .map(([datum, kalorien]) => ({ datum, kalorien }));

    res.status(200).json(sorted);
  } catch (err) {
    console.error("Fehler in /api/history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Verlaufdaten" });
  }
}
