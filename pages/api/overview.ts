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
    const heute = new Date().toLocaleDateString("de-DE");

    // 📋 Zielwerte aus "Ziele"
    const zieleRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Ziele!A2:G2",
    });

    const ziele = zieleRes.data.values;
    console.log("📋 Zielwerte geladen:", ziele);

    if (!ziele || !Array.isArray(ziele) || ziele.length === 0) {
      throw new Error("Zielwerte konnten nicht geladen werden");
    }

    const [zielKcalRaw, zielKhRaw, zielEiweissRaw, zielFettRaw] = ziele[0];
    const zielKcal = Number(zielKcalRaw) || 2200;
    const zielKh = Number(zielKhRaw) || 250;
    const zielEiweiss = Number(zielEiweissRaw) || 130;
    const zielFett = Number(zielFettRaw) || 70;

    // 🏃 Aktivität von heute
    const aktivitaetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Aktivität!A2:C",
    });

    const aktivitaetRows = aktivitaetRes.data.values || [];
    const aktivitaetHeute = aktivitaetRows
      .filter((row) => row[0] === heute)
      .reduce((sum, row) => sum + (Number(row[2]) || 0), 0);

    const skalierungsFaktor =
      zielKcal > 0 ? (zielKcal + aktivitaetHeute) / zielKcal : 1;

    // 🍽 Tagesdaten aus Tabelle1
    const datenRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Tabelle1!A:G",
    });

    const rows = datenRes.data.values || [];

    let sumKcal = 0;
    let sumEiweiss = 0;
    let sumFett = 0;
    let sumKh = 0;

    const eintraegeMitUhrzeit: { zeit: string; kcal: number }[] = [];

    for (const row of rows.slice(1)) {
      const [datum, uhrzeit, , kcal, eiw, fett, kh] = row;

      if (datum !== heute) continue;

      const kcalNum = Number(kcal) || 0;
      const eiwNum = Number(eiw) || 0;
      const fettNum = Number(fett) || 0;
      const khNum = Number(kh) || 0;

      sumKcal += kcalNum;
      sumEiweiss += eiwNum;
      sumFett += fettNum;
      sumKh += khNum;

      eintraegeMitUhrzeit.push({
        zeit: uhrzeit || "??:??",
        kcal: kcalNum,
      });
    }

    // 📤 Rückgabe
    res.status(200).json({
      kalorien: sumKcal,
      eiweiss: sumEiweiss,
      fett: sumFett,
      kh: sumKh,
      ziel: zielKcal + aktivitaetHeute,
      zielEiweiss: Math.round(zielEiweiss * skalierungsFaktor),
      zielFett: Math.round(zielFett * skalierungsFaktor),
      zielKh: Math.round(zielKh * skalierungsFaktor),
      eintraege: eintraegeMitUhrzeit,
    });
  } catch (err) {
    console.error("❌ Fehler in /api/overview:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Tagesdaten" });
  }
}
