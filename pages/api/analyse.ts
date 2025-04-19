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

    // 📊 Kalorienverlauf
    const kcalRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Tabelle1!A2:G",
    });

    const kcalRows = kcalRes.data.values || [];

    // 📉 Gewicht
    const gewichtRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Gewicht!A2:B",
    });

    const gewichtRows = gewichtRes.data.values || [];

    // 🔥 TDEE-Wert aus "Ziele"
    const zielRes = await sheets.spreadsheets.values.get({
      spreadsheetId: id,
      range: "Ziele!G2:G2", // G: TDEE
    });

    const tdee = Number(zielRes.data.values?.[0]?.[0]) || 2600;

    // 📦 Daten als Text vorbereiten
    const kcalText = kcalRows
      .map(r => `${r[0]} ${r[1] ?? ""} - ${r[3]} kcal`) // Datum, Uhrzeit, Kcal
      .join("\n")
      .slice(0, 3000);

    const gewichtText = gewichtRows
      .map(r => `${r[0]}: ${r[1]} kg`)
      .join("\n")
      .slice(0, 3000);

    // 🤖 GPT Prompt
    const prompt = `
Du bist ein Gesundheitscoach und analysierst Essverhalten.

Du erhältst Kalorien- und Gewichtsdaten. Der geschätzte tägliche Kalorienverbrauch (TDEE) der Person liegt bei **${tdee} kcal**.

Bitte analysiere:

- Durchschnittliches Kaloriendefizit im Vergleich zu TDEE
- Entwicklung des Gewichts
- Tägliche Schwankungen
- Wochenend-/Wochentags-Muster
- Uhrzeit-Muster (wenn möglich)
- Mögliche Fehler oder Ausreißer (z. B. 0 kcal-Tage, unrealistisch hohe Einträge)
- Gib am Ende eine freundliche Empfehlung oder Ermutigung

Kalorien-Daten (Datum Uhrzeit kcal):
${kcalText}

Gewicht (Datum + kg):
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
          { role: "system", content: "Du bist ein einfühlsamer, analytischer Ernährungscoach." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const result = await gptRes.json();
    const analyse = result.choices?.[0]?.message?.content || "Keine Analyse verfügbar.";

    res.status(200).json({ analyse });
  } catch (err) {
    console.error("Fehler bei /api/analyse:", err);
    res.status(500).json({ error: "Analyse fehlgeschlagen" });
  }
}
