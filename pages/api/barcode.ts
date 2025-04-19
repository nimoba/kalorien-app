import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Kein Barcode erhalten" });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await response.json();

    if (!data.product) return res.status(404).json({ error: "Produkt nicht gefunden" });

    const p = data.product;
    const produktname = p.product_name || "Unbekanntes Produkt";

    const safe = (val: any) => (typeof val === "number" ? val : 0);

    let kcal = safe(p.nutriments?.["energy-kcal_100g"]);
    let eiweiß = safe(p.nutriments?.["proteins_100g"]);
    let fett = safe(p.nutriments?.["fat_100g"]);
    let kohlenhydrate = safe(p.nutriments?.["carbohydrates_100g"]);

    const isMissing = (val: any) => val === undefined || val === null;

    const fehlenMakros =
      isMissing(p.nutriments?.["energy-kcal_100g"]) ||
      isMissing(p.nutriments?.["proteins_100g"]) ||
      isMissing(p.nutriments?.["fat_100g"]) ||
      isMissing(p.nutriments?.["carbohydrates_100g"]);

    // 🔍 MENGE schätzen
    let menge = 100; // Fallback
    if (typeof p.serving_quantity === "number") {
      menge = p.serving_quantity;
    } else if (typeof p.serving_size === "string") {
      const match = p.serving_size.match(/(\d+)[ ]?(g|ml)?/i);
      if (match) {
        menge = parseInt(match[1], 10);
      }
    }

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
              content: `Du bist ein Ernährungsberater. Gib nur geschätzte Nährwerte für ein bekanntes Produkt aus – **nicht pro 100g**, sondern realistisch für **eine konsumierte Portion**. Verwende dabei allgemeine Marktstandards.
              
Antwort **nur** im folgenden JSON-Format:

{
  "Kalorien": ...,
  "Eiweiß": ...,
  "Fett": ...,
  "Kohlenhydrate": ...,
  "menge": ...
}`,
            },
            {
              role: "user",
              content: `Ich habe das Produkt „${produktname}“ gegessen. Bitte schätze Kalorien, Eiweiß, Fett, Kohlenhydrate und Menge (in g oder ml) für eine normale Portion.`,
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
      menge = parsed.menge ?? menge; // GPT liefert Menge → falls vorhanden, übernehmen
    }

    // ✅ Nur Daten zurückgeben – NICHT speichern
    res.status(200).json({
      name: produktname,
      Kalorien: kcal,
      Eiweiß: eiweiß,
      Fett: fett,
      Kohlenhydrate: kohlenhydrate,
      menge,
      quelle: fehlenMakros ? "gpt" : "openfoodfacts",
    });
  } catch (err) {
    console.error("Fehler bei Barcode-Verarbeitung:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
}
