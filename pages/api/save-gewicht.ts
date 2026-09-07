import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID } from "../../lib/sheets";
import { todayDE, isoToDE, isValidISO, normalizeDE } from "../../lib/date";

function parseDecimal(input: unknown): string {
  if (typeof input === "string") return input.replace(",", ".");
  return input?.toString() || "";
}

// Saves a weight entry. One row per day: a second entry on the same day replaces the first.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { gewicht, fett, muskel, wasser, datum } = req.body;

  if (!gewicht) return res.status(400).json({ error: "Gewicht ist erforderlich" });

  try {
    const sheets = getSheets();
    const day = isValidISO(datum) ? isoToDE(datum) : todayDE();

    const prev = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Gewicht!A:E" });
    const rows = prev.data.values || [];
    const last = rows.length > 1 ? rows[rows.length - 1] : undefined;

    const neueZeile = [
      day,
      parseDecimal(gewicht),
      fett != null && fett !== "" ? parseDecimal(fett) : (last?.[2] || ""),
      muskel != null && muskel !== "" ? parseDecimal(muskel) : (last?.[3] || ""),
      wasser != null && wasser !== "" ? parseDecimal(wasser) : (last?.[4] || ""),
    ];

    const existingIdx = rows.findIndex((r, i) => i > 0 && r[0] && normalizeDE(String(r[0])) === normalizeDE(day));
    if (existingIdx >= 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID(),
        range: `Gewicht!A${existingIdx + 1}:E${existingIdx + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [neueZeile] },
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID(),
        range: "Gewicht!A:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [neueZeile] },
      });
    }

    if (day === todayDE()) {
      try {
        await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/habits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodLogged: false, weightLogged: true }),
        });
      } catch {
        // optional
      }
    }

    res.status(200).json({ success: true, replaced: existingIdx >= 0 });
  } catch (err) {
    console.error("Fehler beim Speichern des Gewichts:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
