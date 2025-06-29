import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Hole alle Daten aus Tabelle1 (Essen)
    let foodDates: string[] = [];
    try {
      const foodRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId!,
        range: "Tabelle1!A:A",
      });
      foodDates = (foodRes.data.values || [])
        .flat()
        .filter(date => date && date !== 'Datum') // Header raus
        .map(date => date.toString());
    } catch {
      // Tabelle1 existiert nicht
    }

    // Hole alle Daten aus Gewicht
    let weightDates: string[] = [];
    try {
      const weightRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId!,
        range: "Gewicht!A:A",
      });
      weightDates = (weightRes.data.values || [])
        .flat()
        .filter(date => date && date !== 'Datum') // Header raus
        .map(date => date.toString());
    } catch {
      // Gewicht existiert nicht
    }

    // Einzigartige Tage zählen
    const allDates = [...new Set([...foodDates, ...weightDates])];
    const totalDays = allDates.length;

    console.log(`📊 Gefunden: ${foodDates.length} Essen-Tage, ${weightDates.length} Gewicht-Tage, ${totalDays} einzigartige Tage`);

    res.status(200).json({
      totalDays,
      foodDays: foodDates.length,
      weightDays: weightDates.length
    });

  } catch (error) {
    console.error("❌ Fehler beim Zählen der Tage:", error);
    res.status(500).json({ error: "Fehler beim Zählen der Tage" });
  }
}