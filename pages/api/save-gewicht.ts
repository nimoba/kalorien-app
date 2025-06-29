import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): string {
  if (typeof input === "string") {
    return input.replace(",", ".");
  }
  return input?.toString() || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { gewicht, fett, muskel, wasser } = req.body; // ✨ wasser hinzugefügt

  if (!gewicht) {
    return res.status(400).json({ error: "Gewicht ist erforderlich" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const range = "Gewicht!A2:E"; // ✨ Erweitert um Spalte E für Wasser

    // 🧠 Fallback: Letzten bekannten Fett/Muskel/Wasser-Wert holen
    const prevData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const zeilen = prevData.data.values || [];
    const letzte = zeilen[zeilen.length - 1];

    const fallbackFett = letzte?.[2] || "";
    const fallbackMuskel = letzte?.[3] || "";
    const fallbackWasser = letzte?.[4] || ""; // ✨ Fallback für Wasser

    const heute = new Date().toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
    const neueZeile = [
      heute,
      parseDecimal(gewicht),
      fett != null && fett !== "" ? parseDecimal(fett) : fallbackFett,
      muskel != null && muskel !== "" ? parseDecimal(muskel) : fallbackMuskel,
      wasser != null && wasser !== "" ? parseDecimal(wasser) : fallbackWasser, // ✨ Wasser
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Gewicht!A:E", // ✨ Erweitert um Spalte E
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [neueZeile],
      },
    });

    // Update habit tracking
    try {
      await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foodLogged: false, weightLogged: true })
      });
    } catch {
      // Habit tracking is optional, don't fail the main operation
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern des Gewichts:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}