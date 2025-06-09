import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") {
    return parseFloat(input.replace(",", "."));
  }
  return typeof input === "number" ? input : NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { kcal, kh, eiweiss, fett, startgewicht, zielGewicht, tdee } = req.body;

  const kcalVal = parseDecimal(kcal);
  const khVal = parseDecimal(kh);
  const eiweissVal = parseDecimal(eiweiss);
  const fettVal = parseDecimal(fett);
  const startgewichtVal = parseDecimal(startgewicht);
  const zielGewichtVal = zielGewicht != null ? parseDecimal(zielGewicht) : "";
  const tdeeVal = tdee != null ? parseDecimal(tdee) : "";

  if (
    isNaN(kcalVal) || isNaN(khVal) || isNaN(eiweissVal) || isNaN(fettVal) ||
    isNaN(startgewichtVal)
  ) {
    return res.status(400).json({ error: "Ungültige Daten" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const values = [[
      kcalVal,
      khVal,
      eiweissVal,
      fettVal,
      startgewichtVal,
      zielGewichtVal,
      tdeeVal
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Ziele!A2:G2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern der Ziele:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
