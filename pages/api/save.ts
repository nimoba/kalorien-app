import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID } from "../../lib/sheets";
import { todayDE, isoToDE, isValidISO, nowTimeDE } from "../../lib/date";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") return parseFloat(input.replace(",", "."));
  return typeof input === "number" ? input : NaN;
}

// Converts totals back to per-100g base values (used when saving a favourite)
function toBase100(kcal: number, eiweiss: number, fett: number, kh: number, unit: string, menge: number, unitWeight?: number) {
  let grams: number;
  if (unit === 'Stück' || unit === 'Portion') grams = menge * (unitWeight || 1);
  else grams = menge;
  if (!grams || grams <= 0) grams = 100;
  const f = 100 / grams;
  return { kcal: kcal * f, eiweiss: eiweiss * f, fett: fett * f, kh: kh * f };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, kcal, eiweiss, fett, kh, uhrzeit, unit, unitWeight, menge, datum, favorit } = req.body;

  const kcalVal = parseDecimal(kcal);
  const eiweissVal = parseDecimal(eiweiss);
  const fettVal = parseDecimal(fett);
  const khVal = parseDecimal(kh);
  const mengeVal = parseDecimal(menge);
  const unitWeightVal = unitWeight ? parseDecimal(unitWeight) : undefined;

  if (!name || isNaN(kcalVal) || isNaN(eiweissVal) || isNaN(fettVal) || isNaN(khVal)) {
    return res.status(400).json({ error: "Ungültige oder unvollständige Nährwerte" });
  }

  try {
    const sheets = getSheets();
    const isToday = !isValidISO(datum) || isoToDE(datum) === todayDE();
    const day = isValidISO(datum) ? isoToDE(datum) : todayDE();
    const time = uhrzeit || nowTimeDE();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID(),
      range: "Tabelle1!A:J",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          day, time, name, kcalVal, eiweissVal, fettVal, khVal,
          isNaN(mengeVal) ? '' : mengeVal,
          unit || '',
          unitWeightVal && !isNaN(unitWeightVal) ? unitWeightVal : '',
        ]],
      },
    });

    if (favorit === true) {
      const favRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Favoriten!A2:A" });
      const values = favRes.data.values?.flat() || [];
      const exists = values.map((v) => String(v).toLowerCase()).includes(String(name).toLowerCase());
      if (!exists) {
        const base = toBase100(kcalVal, eiweissVal, fettVal, khVal, unit || 'g', mengeVal || 1, unitWeightVal);
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID(),
          range: "Favoriten!A:G",
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [[String(name).toLowerCase(), base.kcal, base.eiweiss, base.fett, base.kh, unit || 'g', unitWeightVal || '']],
          },
        });
      }
    }

    if (isToday) {
      try {
        await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/habits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foodLogged: true, weightLogged: false }),
        });
      } catch {
        // optional
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}
