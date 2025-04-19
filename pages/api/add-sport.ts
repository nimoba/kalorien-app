import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { beschreibung, kcal } = req.body;
  if (!beschreibung || !kcal) {
    return res.status(400).json({ error: "Ungültige Eingaben" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const datum = new Date().toLocaleDateString("de-DE");
    const uhrzeit = new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Aktivitäten!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[datum, beschreibung, kcal, uhrzeit]],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern der Aktivität:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}