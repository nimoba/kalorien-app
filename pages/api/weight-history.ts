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

    // ✅ FLEXIBLES DATUM-PARSING für "5.6.2025" Format
    const parseGermanDate = (dateStr: string): Date | null => {
      try {
        const parts = dateStr.trim().split('.');
        if (parts.length !== 3) return null;
        
        const tag = parseInt(parts[0], 10);
        const monat = parseInt(parts[1], 10);
        let jahr = parseInt(parts[2], 10);
        
        // Handle 2-digit years (25 -> 2025)
        if (jahr < 100) {
          jahr += 2000;
        }
        
        // Validierung
        if (tag < 1 || tag > 31 || monat < 1 || monat > 12 || jahr < 2020) {
          return null;
        }
        
        return new Date(jahr, monat - 1, tag);
      } catch {
        return null;
      }
    };

    // 📘 Gewichtsdaten
    const gewichtData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Gewicht!A2:D",
    });

    const gewichtRows = gewichtData.data.values || [];
    const gewichtMap: Record<string, { gewicht: number; fett: number | null; muskel: number | null }> = {};
    
    for (const row of gewichtRows) {
      const datum = row[0];
      if (!datum) continue;
      
      // ✅ DATUM NORMALISIEREN für einheitliche Keys
      const datumKey = datum.trim();
      gewichtMap[datumKey] = {
        gewicht: Number(row[1]) || 0,
        fett: row[2] ? Number(row[2]) : null,
        muskel: row[3] ? Number(row[3]) : null,
      };
    }

    // ✅ Fixierter Startwert für theoretische Kurve
    const startgewicht = gewichtRows[0]?.[1] ? Number(gewichtRows[0][1]) : 0;

    // 📘 Kalorien-Einträge (Konsum)
    const kcalData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Tabelle1!A2:G",
    });

    const kcalRows = kcalData.data.values || [];
    const kalorienProTag: Record<string, number> = {};
    
    for (const row of kcalRows) {
      const [datum, , , kcal] = row;
      if (!datum || !kcal) continue;
      
      // ✅ DATUM NORMALISIEREN
      const datumKey = datum.trim();
      kalorienProTag[datumKey] = (kalorienProTag[datumKey] || 0) + Number(kcal);
    }

    // 🏃 Aktivitätsdaten
    const aktivitaetRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Aktivitäten!A2:C",
    });

    const aktivitaetRows = aktivitaetRes.data.values || [];
    const aktivitaetMap: Record<string, number> = {};
    
    for (const row of aktivitaetRows) {
      const [datum, , kcal] = row;
      if (!datum || !kcal) continue;
      
      // ✅ DATUM NORMALISIEREN
      const datumKey = datum.trim();
      aktivitaetMap[datumKey] = (aktivitaetMap[datumKey] || 0) + Number(kcal);
    }

    // 📊 Ziel-Kcal und TDEE aus Ziele-Tabelle
    const zielRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Ziele!A2:G2",
    });

    const [, , , , , zielGewichtRaw, tdeeRaw] = zielRes.data.values?.[0] || [];
    const zielGewicht = zielGewichtRaw ? Number(zielGewichtRaw) : null;
    const tdee = Number(tdeeRaw) || 2600;

    // 📐 Verläufe
    const theoriewerte: { datum: string; gewicht: number }[] = [];
    const verlauf: { datum: string; gewicht: number }[] = [];
    const fett: { datum: string; wert: number | null }[] = [];
    const muskel: { datum: string; wert: number | null }[] = [];

    // ✅ ALLE VERFÜGBAREN TAGE SAMMELN UND SORTIEREN
    const alleTage = Array.from(new Set([
      ...Object.keys(kalorienProTag),
      ...Object.keys(aktivitaetMap),
      ...Object.keys(gewichtMap)
    ]));

    const sortierteTage = alleTage
      .filter(datum => parseGermanDate(datum) !== null) // Nur gültige Daten
      .sort((a, b) => {
        const dateA = parseGermanDate(a);
        const dateB = parseGermanDate(b);
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });

    let kumuliertesDefizit = 0;
    let letztesGewicht = startgewicht;
    let lastFett: number | null = null;
    let lastMuskel: number | null = null;

    for (const tag of sortierteTage) {
      const konsumiert = kalorienProTag[tag] || 0;
      const aktiv = aktivitaetMap[tag] || 0;
      const verbraucht = tdee + aktiv;

      const defizit = verbraucht - konsumiert;
      kumuliertesDefizit += defizit;

      const deltaKg = kumuliertesDefizit / 7700;
      const theoGewicht = parseFloat((startgewicht - deltaKg).toFixed(2));
      theoriewerte.push({ datum: tag, gewicht: theoGewicht });

      const g = gewichtMap[tag];
      if (g) {
        letztesGewicht = g.gewicht;
        lastFett = g.fett;
        lastMuskel = g.muskel;
      }

      verlauf.push({ datum: tag, gewicht: parseFloat(letztesGewicht.toFixed(2)) });
      fett.push({ datum: tag, wert: lastFett });
      muskel.push({ datum: tag, wert: lastMuskel });
    }

    // ✅ 7-TAGE GLÄTTUNG
    const smoothed = verlauf.map((_, i, arr) => {
      const slice = arr.slice(Math.max(i - 3, 0), i + 4);
      const avg = slice.reduce((sum, e) => sum + e.gewicht, 0) / slice.length;
      return { datum: verlauf[i].datum, gewicht: Number(avg.toFixed(2)) };
    });

    // ✅ TRENDLINIE
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
        gewicht: Number((slope * xi + intercept).toFixed(2)),
      }));
    }

    const trend = lineRegression(verlauf.map(v => v.gewicht));

    res.status(200).json({
      startgewicht,
      verlauf,
      theoretisch: theoriewerte,
      geglättet: smoothed,
      trend,
      fett,
      muskel,
      zielGewicht,
      tdee,
    });
  } catch (err) {
    console.error("❌ Fehler in /api/weight-history:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Daten" });
  }
}