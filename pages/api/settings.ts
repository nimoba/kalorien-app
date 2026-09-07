import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID, num } from "../../lib/sheets";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sheets = getSheets(true);
    const result = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Ziele!A2:G2" });
    const [kcal, kh, eiweiss, fett, startgewicht, zielGewicht, tdee] = result.data.values?.[0] || [];

    res.status(200).json({
      zielKcal: num(kcal) || 2200,
      zielKh: num(kh) || 250,
      zielEiweiss: num(eiweiss) || 130,
      zielFett: num(fett) || 70,
      startgewicht: num(startgewicht) || 0,
      zielGewicht: zielGewicht ? num(zielGewicht) : null,
      tdee: num(tdee) || 2600,
    });
  } catch (err) {
    console.error("Fehler beim Laden der Zielwerte:", err);
    res.status(500).json({ error: "Fehler beim Laden der Zielwerte" });
  }
}
