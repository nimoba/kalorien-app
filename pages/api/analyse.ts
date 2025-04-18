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

    const [kcalData, gewichtData] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Tabelle1!A2:G" }),
      sheets.spreadsheets.values.get({ spreadsheetId: id, range: "Gewicht!A2:B" }),
    ]);

    const kcalRows = kcalData.data.values || [];
    const gewichtRows = gewichtData.data.values || [];

    const kcalText = kcalRows.map(r => `${r[0]}: ${r[3]} kcal`).join("\n").slice(0, 3000);
    const gewichtText = gewichtRows.map(r => `${r[0]}: ${r[1]} kg`).join("\n").slice(0, 3000);

    const prompt = `
Du bist ein Ernährungs- und Gesundheitscoach. Analysiere die folgenden Kalorien- und Gewichtsdaten.

Gib eine Zusammenfassung im Stil:
- Durchschnittliches Defizit
- Entwicklung des Gewichts
- Geschätzte Zielreichweite
- Motivation oder Hinweis

Kalorienverbrauch:
${kcalText}

Gewicht:
${gewichtText}
`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Du bist ein Ernährungscoach." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const result = await gptRes.json();
    const analyse = result.choices?.[0]?.message?.content || null;

    res.status(200).json({ analyse });
  } catch (err) {
    console.error("Fehler bei /api/analyse:", err);
    res.status(500).json({ error: "Analyse fehlgeschlagen" });
  }
}
