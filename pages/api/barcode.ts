import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Kein Barcode erhalten" });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await response.json();

    if (!data.product) return res.status(404).json({ error: "Produkt nicht gefunden" });

    const p = data.product;
    const produktname = p.product_name || "Unbekanntes Produkt";

    let kcal = p.nutriments?.["energy-kcal_100g"] || 0;
    let eiweiß = p.nutriments?.["proteins_100g"] || 0;
    let fett = p.nutriments?.["fat_100g"] || 0;
    let kohlenhydrate = p.nutriments?.["carbohydrates_100g"] || 0;

    // ⛔ Wenn Daten fehlen → GPT-Fallback
    const fehlenMakros = kcal === 0 || eiweiß === 0 || fett === 0 || kohlenhydrate === 0;

    if (fehlenMakros) {
      const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
              content: "Du bist ein Ernährungsberater. Gib nur geschätzte Nährwerte für ein bekanntes Produkt aus, im Format: {\"Kalorien\":..., \"Eiweiß\":..., \"Fett\":..., \"Kohlenhydrate\":...}",
            },
            {
              role: "user",
              content: `Ich habe das Produkt „${produktname}“ gegessen. Bitte schätze Kalorien, Eiweiß, Fett, Kohlenhydrate für eine normale Portion.`,
            },
          ],
        }),
      });

      const gptJson = await gptRes.json();
      const content = gptJson.choices[0].message.content.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(content);

      kcal = parsed.Kalorien;
      eiweiß = parsed.Eiweiß;
      fett = parsed.Fett;
      kohlenhydrate = parsed.Kohlenhydrate;
    }

    // ✅ In Google Sheet eintragen
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
        values: [[today, `${produktname} (per Barcode)`, kcal, eiweiß, fett, kohlenhydrate]],
      },
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Favoriten!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[produktname.toLowerCase(), kcal, eiweiß, fett, kohlenhydrate]],
      },
    });

    res.status(200).json({
      name: produktname,
      Kalorien: kcal,
      Eiweiß: eiweiß,
      Fett: fett,
      Kohlenhydrate: kohlenhydrate,
      quelle: fehlenMakros ? "gpt" : "openfoodfacts",
    });
  } catch (err) {
    console.error("Fehler bei Barcode-Eintrag:", err);
    res.status(500).json({ error: "Fehler bei Produktsuche oder Sheets-Zugriff" });
  }
}
