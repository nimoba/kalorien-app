import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { kcal, kh, eiweiss, fett, startgewicht, zielGewicht } = req.body;

  if (
    !kcal || !kh || !eiweiss || !fett ||
    typeof startgewicht === "undefined"
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

    const values = [[kcal, kh, eiweiss, fett, startgewicht, zielGewicht ?? ""]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Ziele!A2:F2", // F2 = Zielgewicht
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
