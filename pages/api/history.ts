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

    const kcalRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Tabelle1!A2:D",
    });

    const aktivRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Aktivitäten!A2:C",
    });

    const kcalRows = kcalRes.data.values || [];
    const aktivRows = aktivRes.data.values || [];

    const today = new Date();
    const datenMap = new Map<string, number>();

    for (const row of kcalRows) {
      const [datum, , , kcal] = row;
      const num = Number(kcal);
      if (!datum || isNaN(num)) continue;

      const [d, m, y] = datum.split(".");
      const entryDate = new Date(`${y}-${m}-${d}`);
      const diff = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 30) continue;

      datenMap.set(datum, (datenMap.get(datum) || 0) + num);
    }

    for (const row of aktivRows) {
      const [datum, , kcal] = row;
      const num = Number(kcal);
      if (!datum || isNaN(num)) continue;

      const [d, m, y] = datum.split(".");
      const entryDate = new Date(`${y}-${m}-${d}`);
      const diff = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 30) continue;

      datenMap.set(datum, (datenMap.get(datum) || 0) + num);
    }

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
