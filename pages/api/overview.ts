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
    const range = "Tabelle1!A:F"; // ⬅️ Spalten: Datum | Beschreibung | kcal | Eiweiß | Fett | KH

    const sheetData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const rows = sheetData.data.values || [];

    // ✅ Heute als "TT.MM.JJJJ" im deutschen Format
    const heute = new Date().toLocaleDateString("de-DE");

    let sumKcal = 0;
    let sumEiweiss = 0;
    let sumFett = 0;
    let sumKh = 0;

    const eintraegeMitUhrzeit: {
      zeit: string;
      kcal: number;
    }[] = [];

    for (const row of rows.slice(1)) {
      const [datum, , kcal, eiw, fett, kh] = row;

      if (datum !== heute) continue;

      sumKcal += Number(kcal) || 0;
      sumEiweiss += Number(eiw) || 0;
      sumFett += Number(fett) || 0;
      sumKh += Number(kh) || 0;

      eintraegeMitUhrzeit.push({
        zeit: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }), // später aus Sheet ableitbar
        kcal: Number(kcal) || 0,
      });
    }

    res.status(200).json({
      kalorien: sumKcal,
      eiweiss: sumEiweiss,
      fett: sumFett,
      kh: sumKh,
      ziel: 2200, // später dynamisch machbar
      eintraege: eintraegeMitUhrzeit,
    });
  } catch (err) {
    console.error("Fehler in /api/overview:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Tagesdaten" });
  }
}
