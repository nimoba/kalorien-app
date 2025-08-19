import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") {
    return parseFloat(input.replace(",", "."));
  }
  return typeof input === "number" ? input : NaN;
}

// Konvertiert zu Basis-Werten (pro 100g/100ml) für Favoriten-Speicherung
function toBase100Values(kcal: number, eiweiss: number, fett: number, kh: number, 
                        unit: string, menge: number, unitWeight?: number): 
                        {kcal: number, eiweiss: number, fett: number, kh: number} {
  let actualGrams: number;
  
  if (unit === 'g' || unit === 'ml') {
    actualGrams = menge;
  } else if (unit === 'Stück' || unit === 'Portion') {
    actualGrams = menge * (unitWeight || 1);
  } else {
    actualGrams = menge; // Fallback
  }
  
  // Konvertiere zu pro 100g Basis
  const factor = 100 / actualGrams;
  
  return {
    kcal: kcal * factor,
    eiweiss: eiweiss * factor,
    fett: fett * factor,
    kh: kh * factor
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { name, kcal, eiweiss, fett, kh, uhrzeit, unit, unitWeight, menge } = req.body;

  const kcalVal = parseDecimal(kcal);
  const eiweissVal = parseDecimal(eiweiss);
  const fettVal = parseDecimal(fett);
  const khVal = parseDecimal(kh);
  const mengeVal = parseDecimal(menge);
  const unitWeightVal = unitWeight ? parseDecimal(unitWeight) : undefined;

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
      // Konvertiere zu Basis-Werten für Favoriten-Speicherung
      const baseValues = toBase100Values(kcalVal, eiweissVal, fettVal, khVal, unit || 'g', mengeVal || 1, unitWeightVal);
      
      await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Favoriten!A:G", // Erweitert um Einheit und Einheitsgewicht
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [[
            name.toLowerCase(), 
            baseValues.kcal, 
            baseValues.eiweiss, 
            baseValues.fett, 
            baseValues.kh,
            unit || 'g',
            unitWeightVal || ''
          ]],
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
