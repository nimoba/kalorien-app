// pages/api/track.ts
import { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Kein Text erhalten" });

  // GPT-Aufruf
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "Du bist ein Ernährungsberater. Für eine Beschreibung gib Kalorien, Eiweiß, Fett, KH geschätzt zurück. Format: {\"Kalorien\":..., \"Eiweiß\":..., \"Fett\":..., \"Kohlenhydrate\":...}",
        },
        { role: "user", content: text },
      ],
    }),
  });

  const gptJson = await openaiRes.json();
  const content = gptJson.choices[0].message.content.replace(/```json|```/g, "").trim();
  const werte = JSON.parse(content);

  // Google Sheets vorbereiten
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const today = new Date().toLocaleDateString("de-DE");

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Tabelle1!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[today, text, werte.Kalorien, werte.Eiweiß, werte.Fett, werte.Kohlenhydrate]],
    },
  });

  res.status(200).json({ success: true });
}
