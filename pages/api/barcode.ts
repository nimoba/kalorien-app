import type { NextApiRequest, NextApiResponse } from "next";
import { chatJSON, MODEL_PRECISE } from "../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: "Kein Barcode erhalten" });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await response.json();

    if (!data.product) return res.status(404).json({ error: "Produkt nicht gefunden" });

    const p = data.product;
    const produktname = p.product_name || "Unbekanntes Produkt";

    const safe = (val: unknown) => (typeof val === "number" ? val : 0);

    let kcal = safe(p.nutriments?.["energy-kcal_100g"]);
    let eiweiß = safe(p.nutriments?.["proteins_100g"]);
    let fett = safe(p.nutriments?.["fat_100g"]);
    let kohlenhydrate = safe(p.nutriments?.["carbohydrates_100g"]);

    const isMissing = (val: unknown) => val === undefined || val === null;

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
      const parsed = await chatJSON<{ Kalorien: number; Eiweiß: number; Fett: number; Kohlenhydrate: number; portion_g: number }>({
        model: MODEL_PRECISE,
        reasoning: "low",
        json: {
          name: "produkt_naehrwerte",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["Kalorien", "Eiweiß", "Fett", "Kohlenhydrate", "portion_g"],
            properties: {
              Kalorien: { type: "number", description: "kcal pro 100 g/ml" },
              Eiweiß: { type: "number", description: "g pro 100 g/ml" },
              Fett: { type: "number", description: "g pro 100 g/ml" },
              Kohlenhydrate: { type: "number", description: "g pro 100 g/ml" },
              portion_g: { type: "number", description: "Übliche Verzehrportion in g/ml" },
            },
          },
        },
        messages: [
          { role: "developer", content: "Du bist Ernährungsberater. Gib die Nährwerte eines Produkts **pro 100 g bzw. 100 ml** an, wie sie auf der Verpackung in Deutschland stehen würden, sowie die übliche Portionsgröße." },
          {
            role: "user",
            content: `Produkt: „${produktname}“${p.brands ? ` (Marke: ${p.brands})` : ""}${p.quantity ? `, Packung: ${p.quantity}` : ""}${p.categories ? `, Kategorie: ${p.categories}` : ""}.
Bekannte Werte pro 100 g (fehlende ergänzen, vorhandene übernehmen): kcal ${p.nutriments?.["energy-kcal_100g"] ?? "?"}, Eiweiß ${p.nutriments?.["proteins_100g"] ?? "?"}, Fett ${p.nutriments?.["fat_100g"] ?? "?"}, KH ${p.nutriments?.["carbohydrates_100g"] ?? "?"}.`,
          },
        ],
      });

      kcal = parsed.Kalorien;
      eiweiß = parsed.Eiweiß;
      fett = parsed.Fett;
      kohlenhydrate = parsed.Kohlenhydrate;
      if (!p.serving_quantity && !p.serving_size && parsed.portion_g > 0) menge = Math.round(parsed.portion_g);
    }

    // 🔍 Einheits-Erkennung
    let unit: 'g' | 'ml' | 'Stück' | 'Portion' = 'g';
    let unitWeight: number | undefined;

    // Versuche Einheit aus Produktdaten zu erkennen
    const categories = p.categories_tags || [];
    const isLiquid = categories.some((cat: string) => 
      cat.includes('beverage') || cat.includes('drink') || cat.includes('milk') || cat.includes('juice')
    );
    
    if (isLiquid) {
      unit = 'ml';
    } else if (p.serving_quantity && p.serving_quantity !== 100) {
      // Wenn Portionsgröße verfügbar und nicht 100g, als Stück behandeln
      unit = 'Stück';
      unitWeight = p.serving_quantity;
      menge = 1;
    }

    // ✅ Nur Daten zurückgeben – NICHT speichern
    res.status(200).json({
      name: produktname,
      Kalorien: kcal,
      Eiweiß: eiweiß,
      Fett: fett,
      Kohlenhydrate: kohlenhydrate,
      menge,
      unit,
      unitWeight,
      quelle: fehlenMakros ? "gpt" : "openfoodfacts",
    });
  } catch (err) {
    console.error("Fehler bei Barcode-Verarbeitung:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
}
