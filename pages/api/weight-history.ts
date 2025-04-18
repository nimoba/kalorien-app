import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // 📘 Gewichtsdaten
    const gewichtData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Gewicht!A2:D",
    });

    const gewichtRows = gewichtData.data.values || [];

    const verlauf = gewichtRows.map((row) => ({
      datum: row[0],
      gewicht: Number(row[1]),
    }));

    const startgewicht = verlauf?.[0]?.gewicht || 0;

    // 📘 Kalorienverlauf
    const kcalData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Tabelle1!A2:G",
    });

    const kcalRows = kcalData.data.values || [];

    const kalorienProTag: Record<string, number> = {};
    for (const row of kcalRows) {
      const [datum, , kcal] = row;
      if (!datum || !kcal) continue;

      const d = datum.trim();
      const kcalNum = Number(kcal);
      if (!kalorienProTag[d]) kalorienProTag[d] = 0;
      kalorienProTag[d] += kcalNum;
    }

    // 📊 Ziel-Kcal aus Ziele-Tabelle
    const zielRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Ziele!A2:A2",
    });

    const zielKcal = Number(zielRes.data.values?.[0]?.[0]) || 2200;

    // 📐 Theoretischer Gewichtsverlauf
    const theoriewerte: { datum: string; gewicht: number }[] = [];
    let aktuellesGewicht = startgewicht;
    let kumuliertesDefizit = 0;

    const sortierteTage = Object.keys(kalorienProTag)
      .sort((a, b) => {
        const [t1, m1, j1] = a.split(".");
        const [t2, m2, j2] = b.split(".");
        return new Date(`${j1}-${m1}-${t1}`).getTime() - new Date(`${j2}-${m2}-${t2}`).getTime();
      });

    for (const tag of sortierteTage) {
      const konsumiert = kalorienProTag[tag];
      const defizit = zielKcal - konsumiert; // ⬅️ wenn negativ → Zunahme
      kumuliertesDefizit += defizit;

      const deltaKg = kumuliertesDefizit / 7700;
      const gewicht = parseFloat((startgewicht - deltaKg).toFixed(2));

      theoriewerte.push({ datum: tag, gewicht });
    }
    // 📊 Gleitender Durchschnitt (7-Tage-Mittel)
const smoothed = verlauf.map((_, i, arr) => {
  const slice = arr.slice(Math.max(i - 3, 0), i + 4);
  const avg = slice.reduce((sum, e) => sum + e.gewicht, 0) / slice.length;
  return { datum: verlauf[i].datum, gewicht: Number(avg.toFixed(2)) };
});

// 📈 Lineare Regression (Trend)
function lineRegression(yVals: number[]) {
  const x = yVals.map((_, i) => i);
  const y = yVals;
  const n = x.length;
  const avgX = x.reduce((a, b) => a + b) / n;
  const avgY = y.reduce((a, b) => a + b) / n;

  const slope = x.reduce((sum, xi, i) => sum + (xi - avgX) * (y[i] - avgY), 0)
    / x.reduce((sum, xi) => sum + Math.pow(xi - avgX, 2), 0);

  const intercept = avgY - slope * avgX;

  return x.map((xi, i) => ({
    datum: verlauf[i]?.datum || `Tag ${i + 1}`,
    gewicht: Number((slope * xi + intercept).toFixed(2))
  }));
}

const trend = lineRegression(verlauf.map(v => v.gewicht));
    res.status(200).json({
        startgewicht,
        verlauf,
        theoretisch: theoriewerte,
        geglättet: smoothed,
        trend,
    });
  } catch (err) {
    console.error("Fehler in /api/weight-history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Daten" });
  }
}
