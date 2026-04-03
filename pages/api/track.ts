import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

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
  const favorit = await checkFavoritMatch(text);
  if (favorit) {
    return res.status(200).json({ source: "favoriten", ...favorit });
  }

  // GPT-Fallback
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `Du bist ein Ernährungsberater. Bitte gib die Kalorien und Makros **pro 100 g oder ml** zurück – unabhängig davon, wie viel der Nutzer gegessen hat.

Antworte **nur** im folgenden JSON-Format:

{
  "Kalorien": ...,
  "Eiweiß": ...,
  "Fett": ...,
  "Kohlenhydrate": ...,
  "menge": ...,
  "unit": ...,
  "unitWeight": ...
}

- "menge": geschätzte **verzehrte Menge** in der angegebenen Einheit
- "unit": "g", "ml", "Stück", oder "Portion"
- "unitWeight": Gramm pro Einheit (nur bei Stück/Portion, sonst weglassen)

Beispiele:
- "2 Äpfel" → unit: "Stück", menge: 2, unitWeight: 180
- "250ml Milch" → unit: "ml", menge: 250
- "1 Portion Nudeln" → unit: "Portion", menge: 1, unitWeight: 300
- "100g Reis" → unit: "g", menge: 100

Die Nährwerte sind immer **pro 100 g/ml**.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const gptJson = await openaiRes.json();

  try {
    const content = gptJson.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ error: "Keine Antwort von GPT erhalten" });
    }
    const cleaned = content.replace(/```json|```/g, "").trim();
    const werte = JSON.parse(cleaned);
    return res.status(200).json({ source: "gpt", ...werte });
  } catch {
    console.error("GPT-Antwort konnte nicht geparst werden:", gptJson);
    return res.status(500).json({ error: "GPT-Antwort konnte nicht verarbeitet werden" });
  }
}
