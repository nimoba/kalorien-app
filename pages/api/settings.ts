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

    const range = "Ziele!A2:G2"; // A-F: Kcal, KH, Eiweiß, Fett, Startgewicht, Zielgewicht

    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const [kcal, kh, eiweiss, fett, startgewicht, zielGewicht, tdee] = result.data.values?.[0] || [];

    res.status(200).json({
      zielKcal: Number(kcal) || 2200,
      zielKh: Number(kh) || 250,
      zielEiweiss: Number(eiweiss) || 130,
      zielFett: Number(fett) || 70,
      startgewicht: Number(startgewicht) || 0,
      zielGewicht: zielGewicht ? Number(zielGewicht) : null,
      tdee: Number(tdee) || 2600,
    });

  } catch (err) {
    console.error("Fehler beim Laden der Zielwerte:", err);
    res.status(500).json({ error: "Fehler beim Laden der Zielwerte" });
  }
}
