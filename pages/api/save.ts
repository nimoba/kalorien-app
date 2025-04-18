import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, kcal, eiweiss, fett, kh } = req.body;

  if (
    !name ||
    isNaN(Number(kcal)) ||
    isNaN(Number(eiweiss)) ||
    isNaN(Number(fett)) ||
    isNaN(Number(kh))
  ) {
    return res.status(400).json({ error: "Ungültige oder unvollständige Nährwerte" });
  }
  

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const today = new Date().toLocaleDateString("de-DE");
    const time = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

    // ✅ Eintrag in Tabelle1
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Tabelle1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[today, time, name, kcal, eiweiss, fett, kh]],
      },
    });

    // ✅ Favoriten nur speichern, wenn nicht vorhanden
    const favRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Favoriten!A2:A",
    });

    const values = favRes.data.values?.flat() || [];
    const exists = values.map(v => v.toLowerCase()).includes(name.toLowerCase());
    
    console.log("🔍 Daten zum Speichern:", { name, kcal, eiweiss, fett, kh });

    if (!exists) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Favoriten!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[name.toLowerCase(), kcal, eiweiss, fett, kh]],
        },
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
