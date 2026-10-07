import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { chatJSON, aggregateFood, FOOD_RULES, FOOD_SCHEMA, MODEL_PRECISE, type FoodEstimateRaw } from "../../lib/openai";

// ✅ Favoriten-Tabelle checken
async function checkFavoritMatch(name: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Favoriten!A2:G", // Erweitert um Einheit und Einheitsgewicht
  });

  const zeilen = res.data.values || [];
  const nameClean = name.trim().toLowerCase();

  for (const z of zeilen) {
    if (z[0].trim().toLowerCase() === nameClean) {
      const unit = z[5] || 'g';
      const unitWeight = z[6] ? Number(z[6]) : undefined;
      
      return {
        Kalorien: z[1],
        Eiweiß: z[2],
        Fett: z[3],
        Kohlenhydrate: z[4],
        menge: unit === 'Stück' || unit === 'Portion' ? 1 : 100, // Default Menge basierend auf Einheit
        unit: unit,
        unitWeight: unitWeight,
        from: "favoriten",
      };
    }
  }

  return null;
}

// ✅ Haupt-Handler: Schätzen mit GPT oder Favorit – aber NICHT speichern
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Kein Text erhalten" });

  // Favoriten zuerst prüfen
  try {
    const favorit = await checkFavoritMatch(text);
    if (favorit) return res.status(200).json({ source: "favoriten", ...favorit });
  } catch (err) {
    console.error("Favoriten-Abgleich fehlgeschlagen:", err);
  }

  try {
    const raw = await chatJSON<FoodEstimateRaw>({
      model: MODEL_PRECISE,
      reasoning: "low",
      json: FOOD_SCHEMA,
      messages: [
        { role: "developer", content: `Du bist ein präziser Ernährungsberater und schätzt Nährwerte für ein Kalorientracking-Tool.\n${FOOD_RULES}` },
        { role: "user", content: String(text) },
      ],
    });
    const e = aggregateFood(raw);
    return res.status(200).json({
      source: "gpt",
      name: e.name,
      Kalorien: e.kcal,
      Eiweiß: e.eiweiss,
      Fett: e.fett,
      Kohlenhydrate: e.kh,
      menge: e.menge,
      unit: e.unit,
      unitWeight: e.unitWeight,
      gesamt: e.gesamt,
      komponenten: e.komponenten,
    });
  } catch (err) {
    console.error("Fehler bei KI-Schätzung:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Schätzung fehlgeschlagen" });
  }
}
