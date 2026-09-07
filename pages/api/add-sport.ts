import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID } from "../../lib/sheets";
import { todayDE, isoToDE, isValidISO, nowTimeDE } from "../../lib/date";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") return parseFloat(input.replace(",", "."));
  return typeof input === "number" ? input : NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { beschreibung, kcal, uhrzeit, datum } = req.body;
  const kcalVal = parseDecimal(kcal);

  if (!beschreibung || isNaN(kcalVal)) {
    return res.status(400).json({ error: "Ungültige Eingaben" });
  }

  try {
    const sheets = getSheets();
    const day = isValidISO(datum) ? isoToDE(datum) : todayDE();
    const uhr = uhrzeit || nowTimeDE();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID(),
      range: "Aktivitäten!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[day, beschreibung, kcalVal, uhr]] },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern der Aktivität:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
