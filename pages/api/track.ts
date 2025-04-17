import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";
import { useState } from "react";
import BarcodeScanner from "../components/BarcodeScanner"; // 👈 dein Component

// ⬇️ Favoriten-Tabelle checken
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
        from: "favoriten",
      };
    }
  }

  return null;
}

// ⬇️ Haupt-Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Kein Text erhalten" });

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth });
  const today = new Date().toLocaleDateString("de-DE");

  // 🧠 Favoriten-Check zuerst
  const favorit = await checkFavoritMatch(text);
  if (favorit) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Tabelle1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[today, text, favorit.Kalorien, favorit.Eiweiß, favorit.Fett, favorit.Kohlenhydrate]],
      },
    });

    return res.status(200).json({ source: "favoriten", ...favorit });
  }

  // 🤖 GPT-Call, wenn kein Favorit vorhanden
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
          content: `Du bist ein Ernährungsberater und sollst eine Kalorien- und Makronährwertschätzung (Kalorien, Eiweiß, Fett, Kohlenhydrate) zu einer freien Texteingabe liefern.

          Der Nutzer schreibt, was er gegessen hat - in natürlicher Sprache, manchmal nur ein paar Wörter, manchmal mit Zusatzinfos wie Rezept oder Portionsgröße. Hier gelten folgende Regeln:

          1. Die Menge wird oft als ausgeschriebenes Wort („ein“, „zwei“) oder Zahl („1“, „2“) geschrieben, manchmal vage („ein bisschen“, „eine Handvoll“). Immer bezieht sich die Menge auf **verzehrte Einheiten**, nicht pro 100g.

          2. Wenn ein Lebensmittel oder Fertigprodukt genannt wird (z. B. „Redbull“, „Happy Hippo“, „Apfel“, „Pom-Bär“), interpretiere die Menge so:
            - „1 Redbull“ = 250 ml
            - „1 Happy Hippo“ = 1 Stück (nicht ganze Packung)
            - „1 Packung Pom-Bär“ = ganze 50 g Tüte
            - „1 Apfel“ ≈ 150 g, „kleiner Apfel“ ≈ 100 g
            - „2/5 Kinderschokolade“ = 2 von 5 Balken eines Riegels (= 0.4 Riegel)

          3. Wenn Begriffe wie „Portion“, „Schüssel“ oder „Teller“ vorkommen, nutze realistische Portionsgrößen (z. B. 300–450 g je nach Gericht). „Ich habe Rezept XY gekocht und die Hälfte gegessen“ → bedeutet: 50 % der geschätzten Gesamtwerte.

          4. Bei vagen Angaben wie „ein bisschen Käse“ oder „Handvoll Chips“, gehe von einer kleinen realistischen Menge aus (10–25 g).

          5. Verarbeite auch Sätze wie „Ich habe xy gegessen“, „Heute zum Mittag gab’s...“ – extrahiere relevante Infos und gib **nur die geschätzten Gesamtwerte der Mahlzeit** aus.

          6. Antworte ausschließlich im folgenden JSON-Format (keine weiteren Erklärungen):

          {"Kalorien":..., "Eiweiß":..., "Fett":..., "Kohlenhydrate":...}`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  const gptJson = await openaiRes.json();
  const content = gptJson.choices[0].message.content.replace(/```json|```/g, "").trim();
  const werte = JSON.parse(content);

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Tabelle1!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[today, text, werte.Kalorien, werte.Eiweiß, werte.Fett, werte.Kohlenhydrate]],
    },
  });

  // ⬇️ Danach: in Favoriten speichern (wenn noch nicht vorhanden)
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Favoriten!A:E",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[text.trim().toLowerCase(), werte.Kalorien, werte.Eiweiß, werte.Fett, werte.Kohlenhydrate]],
    },
  });


  res.status(200).json({ source: "gpt", ...werte });
}