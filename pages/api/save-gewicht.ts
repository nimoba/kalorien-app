import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: any): string {
  if (typeof input === "string") {
    return input.replace(",", ".");
  }
  return input?.toString() || "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { gewicht, fett, muskel } = req.body;

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
    const range = "Gewicht!A2:D";

    // 🧠 Fallback: Letzten bekannten Fett/Muskel-Wert holen
    const prevData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });

    const zeilen = prevData.data.values || [];
    const letzte = zeilen[zeilen.length - 1];

    const fallbackFett = letzte?.[2] || "";
    const fallbackMuskel = letzte?.[3] || "";

    const heute = new Date().toLocaleDateString("de-DE");

    const neueZeile = [
      heute,
      parseDecimal(gewicht),
      fett != null && fett !== "" ? parseDecimal(fett) : fallbackFett,
      muskel != null && muskel !== "" ? parseDecimal(muskel) : fallbackMuskel,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Gewicht!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [neueZeile],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern des Gewichts:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
