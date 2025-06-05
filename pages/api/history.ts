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

    // ✅ Ziel-Kcal laden (statt TDEE)
    const zielRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Ziele!A2:A2", // Spalte A: Kcal-Ziel
    });

    const zielKcal = Number(zielRes.data.values?.[0]?.[0]) || 2200;

    // 📄 Kalorien-Einträge
    const kcalRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Tabelle1!A2:D",
    });

    // 🏃 Aktivitäten
    const aktivRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Aktivitäten!A2:C",
    });

    const today = new Date(new Date().toLocaleString("en-US", {timeZone: "Europe/Berlin"}));
    const kcalRows = kcalRes.data.values || [];
    const aktivRows = aktivRes.data.values || [];

    const kalorienMap = new Map<string, number>();
    const aktivitaetMap = new Map<string, number>();

    // 🍽 Kalorien summieren
    for (const row of kcalRows) {
      const [datum, , , kcal] = row;
      const num = Number(kcal);
      if (!datum || isNaN(num)) continue;

      const [d, m, y] = datum.split(".");
      const entryDate = new Date(`${y}-${m}-${d}`);
      const diff = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 30) continue;

      kalorienMap.set(datum, (kalorienMap.get(datum) || 0) + num);
    }

    // 🏃 Aktivität summieren
    for (const row of aktivRows) {
      const [datum, , kcal] = row;
      const num = Number(kcal);
      if (!datum || isNaN(num)) continue;

      const [d, m, y] = datum.split(".");
      const entryDate = new Date(`${y}-${m}-${d}`);
      const diff = (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 0 || diff > 30) continue;

      aktivitaetMap.set(datum, (aktivitaetMap.get(datum) || 0) + num);
    }

    // 🎯 Zusammenführen
    const allDates = new Set([...kalorienMap.keys(), ...aktivitaetMap.keys()]);
    const sorted = Array.from(allDates)
      .sort((a, b) => {
        const [da, ma, ja] = a.split(".").map(Number);
        const [db, mb, jb] = b.split(".").map(Number);
        return new Date(ja, ma - 1, da).getTime() - new Date(jb, mb - 1, db).getTime();
      })
      .map((datum) => ({
        datum,
        kalorien: kalorienMap.get(datum) || 0,
        ziel: zielKcal + (aktivitaetMap.get(datum) || 0),
      }));

    res.status(200).json(sorted);
  } catch (err) {
    console.error("Fehler in /api/history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Verlaufdaten" });
  }
}
