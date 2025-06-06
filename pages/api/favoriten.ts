// pages/api/favoriten.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export interface FavoritItem {
  name: string;
  kcal: number;
  eiweiss: number;
  fett: number;
  kh: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const favoritenRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Favoriten!A2:E", // A=Name, B=Kcal, C=Eiweiß, D=Fett, E=KH
    });

    const rows = favoritenRes.data.values || [];
    
    const favoriten: FavoritItem[] = rows
      .filter(row => row[0] && row[1]) // Name und Kalorien müssen vorhanden sein
      .map(row => ({
        name: row[0].toString(),
        kcal: Number(row[1]) || 0,
        eiweiss: Number(row[2]) || 0,
        fett: Number(row[3]) || 0,
        kh: Number(row[4]) || 0,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)); // Alphabetisch sortieren

    console.log(`📋 ${favoriten.length} Favoriten geladen`);
    res.status(200).json(favoriten);
  } catch (err) {
    console.error("❌ Fehler beim Laden der Favoriten:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Favoriten" });
  }
}