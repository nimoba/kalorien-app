// pages/api/gewicht-latest.ts

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

    const gewichtRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Gewicht!B2:B", // Spalte B = Gewicht, ab Zeile 2
    });

    const rows = gewichtRes.data.values || [];

    // Nimm den letzten gültigen (nicht-leeren) Eintrag von unten
    for (let i = rows.length - 1; i >= 0; i--) {
      const val = parseFloat(rows[i][0]);
      if (!isNaN(val)) {
        return res.status(200).json({ gewicht: val });
      }
    }

    return res.status(404).json({ error: "Kein gültiger Gewichtseintrag gefunden" });
  } catch (err) {
    console.error("Fehler beim Laden des Gewichts:", err);
    res.status(500).json({ error: "Fehler beim Abrufen des Gewichts" });
  }
}
