import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") {
    return parseFloat(input.replace(",", "."));
  }
  return typeof input === "number" ? input : NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, kcal, eiweiss, fett, kh, uhrzeit } = req.body;

  const kcalVal = parseDecimal(kcal);
  const eiweissVal = parseDecimal(eiweiss);
  const fettVal = parseDecimal(fett);
  const khVal = parseDecimal(kh);

  if (
    !name ||
    isNaN(kcalVal) ||
    isNaN(eiweissVal) ||
    isNaN(fettVal) ||
    isNaN(khVal)
  ) {
    return res.status(400).json({ error: "Ungültige oder unvollständige Nährwerte" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const today = new Date().toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
    const time = uhrzeit || new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Tabelle1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[today, time, name, kcalVal, eiweissVal, fettVal, khVal]],
      },
    });

    const favRes = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Favoriten!A2:A",
    });

    const values = favRes.data.values?.flat() || [];
    const exists = values.map(v => v.toLowerCase()).includes(name.toLowerCase());

    if (!exists) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Favoriten!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[name.toLowerCase(), kcalVal, eiweissVal, fettVal, khVal]],
        },
      });
    }

    // Update habit tracking
    try {
      await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodLogged: true, weightLogged: false })
      });
    } catch {
      // Habit tracking is optional, don't fail the main operation
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
