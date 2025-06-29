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
    range: "Favoriten!A2:E",
  });

  const zeilen = res.data.values || [];
  const nameClean = name.trim().toLowerCase();

  for (const z of zeilen) {
    if (z[0].trim().toLowerCase() === nameClean) {
      return {
        Kalorien: z[1],
        Eiweiß: z[2],
        Fett: z[3],
        Kohlenhydrate: z[4],
        menge: 100, // Favoriten gelten als "pro 100g"
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

  // const auth = new google.auth.GoogleAuth({
  //   credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
  //   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  // });

  // const sheets = google.sheets({ version: "v4", auth });

  // 🧠 Favoriten zuerst prüfen
  const favorit = await checkFavoritMatch(text);
  if (favorit) {
    return res.status(200).json({ source: "favoriten", ...favorit });
  }

  // 🤖 GPT-Fallback
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
  "menge": ...
}

"menge" steht für die geschätzte **verzehrte Menge in g oder ml**. Die Nährwerte sind aber **pro 100 g/ml**.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const gptJson = await openaiRes.json();
  const content = gptJson.choices[0].message.content.replace(/```json|```/g, "").trim();
  const werte = JSON.parse(content);

  return res.status(200).json({ source: "gpt", ...werte });
}
