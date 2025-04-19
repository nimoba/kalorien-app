import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const id = process.env.GOOGLE_SHEET_ID;

    // ✅ TDEE holen
    const tdeeRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Ziele!G2:G2",
    });
    const tdee = Number(tdeeRes.data.values?.[0]?.[0]) || 2500;
    console.log("🔥 TDEE geladen:", tdee);

    // ✅ Kalorien-Einträge holen
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Tabelle1!A2:G",
    });

    const rows = response.data.values || [];
    console.log("📄 Anzahl Kalorien-Zeilen:", rows.length);

    const kcalTage: Record<string, number> = {};

    for (const row of rows) {
      const [datum, , kcal] = row;
      if (!datum || !kcal) continue;

      const key = datum.trim();
      const num = Number(kcal);
      if (isNaN(num)) continue;

      if (!kcalTage[key]) kcalTage[key] = 0;
      kcalTage[key] += num;
    }

    console.log("📆 Aggregierte kcal pro Tag:", kcalTage);

    const sorted = Object.entries(kcalTage).sort(([a], [b]) => {
      const [t1, m1, j1] = a.split(".");
      const [t2, m2, j2] = b.split(".");
      return new Date(`${j1}-${m1}-${t1}`).getTime() - new Date(`${j2}-${m2}-${t2}`).getTime();
    });

    let kumuliertGegessen = 0;
    let kumuliertVerbrauch = 0;

    const result = sorted.map(([datum, kcal]) => {
      kumuliertGegessen += kcal;
      kumuliertVerbrauch += tdee;
      return {
        datum,
        kcalKumuliert: kumuliertGegessen,
        verbrauchKumuliert: kumuliertVerbrauch,
      };
    });

    console.log("📊 Ergebnis für Chart:", result);

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ Fehler bei /api/kcal-history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Kcal-Historie" });
  }
}
