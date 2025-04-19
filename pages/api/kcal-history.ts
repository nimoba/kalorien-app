import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const id = process.env.GOOGLE_SHEET_ID;

    // Ziel-TDEE laden
    const zielRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Ziele!G2:G2",
    });
    const tdee = Number(zielRes.data.values?.[0]?.[0]) || 2500;

    // Kalorien-Einträge
    const eintragRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Tabelle1!A2:D", // A = Datum, D = Kalorien
    });

    // Aktivitätseinträge
    const aktivRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Aktivitäten!A2:C", // A = Datum, C = kcal
    });

    const kcalRows = eintragRes.data.values || [];
    const aktivRows = aktivRes.data.values || [];

    const kcalProTag: Record<string, number> = {};
    for (const row of kcalRows) {
      const [datum, , , kcal] = row;
      const num = Number(kcal);
      if (!datum || isNaN(num)) continue;
      kcalProTag[datum] = (kcalProTag[datum] || 0) + num;
    }

    const aktivProTag: Record<string, number> = {};
    for (const row of aktivRows) {
      const [datum, , kcal] = row;
      const num = Number(kcal);
      if (!datum || isNaN(num)) continue;
      aktivProTag[datum] = (aktivProTag[datum] || 0) + num;
    }

    const alleTage = Array.from(new Set([
      ...Object.keys(kcalProTag),
      ...Object.keys(aktivProTag),
    ])).sort((a, b) => {
      const [t1, m1, j1] = a.split(".");
      const [t2, m2, j2] = b.split(".");
      return new Date(`${j1}-${m1}-${t1}`).getTime() - new Date(`${j2}-${m2}-${t2}`).getTime();
    });

    let kumKcal = 0;
    let kumVerbrauch = 0;
    const result = [];

    for (const tag of alleTage) {
      kumKcal += kcalProTag[tag] || 0;
      kumVerbrauch += tdee + (aktivProTag[tag] || 0);

      result.push({
        datum: tag,
        kcalKumuliert: kumKcal,
        verbrauchKumuliert: kumVerbrauch,
      });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Fehler bei /api/kcal-history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Kcal-Historie" });
  }
}
