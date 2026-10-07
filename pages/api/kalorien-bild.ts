import type { NextApiRequest, NextApiResponse } from "next";
import { chatJSON, aggregateFood, FOOD_RULES, FOOD_SCHEMA, MODEL_PRECISE, type FoodEstimateRaw } from "../../lib/openai";

// Default limit is 1 MB, too small for photos (base64 adds ~33 %).
export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { image, mimeType, hinweis } = req.body || {};
  if (typeof image !== "string" || !image.trim()) {
    return res.status(400).json({ error: "Kein Bild erhalten" });
  }
  const mime = typeof mimeType === "string" && /^image\/(jpeg|png|webp|gif)$/.test(mimeType) ? mimeType : "image/jpeg";

  const prompt = `Schätze die Nährwerte des Essens auf diesem Foto.
Schätze die Portionsgröße anhand von Referenzen im Bild (Tellergröße ≈ 26 cm, Besteck, Hände, Verpackungen). Erkennbare Verpackungsangaben haben Vorrang.
Wenn mehrere Teller/Personen zu sehen sind, schätze nur eine Portion.
Wähle unit "Portion" mit menge 1, außer es sind klar zählbare Einzelstücke (dann "Stück").
${typeof hinweis === "string" && hinweis.trim() ? `Hinweis des Nutzers (hat Vorrang vor dem Bild): ${hinweis.trim()}` : ""}`;

  try {
    const raw = await chatJSON<FoodEstimateRaw>({
      model: MODEL_PRECISE,
      reasoning: "low",
      json: FOOD_SCHEMA,
      messages: [
        { role: "developer", content: `Du bist ein präziser Ernährungsberater und schätzt Nährwerte anhand von Fotos für ein Kalorientracking-Tool.\n${FOOD_RULES}` },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mime};base64,${image}`, detail: "high" } },
          ],
        },
      ],
    });
    return res.status(200).json(aggregateFood(raw));
  } catch (err) {
    console.error("Fehler bei Bild-Analyse:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "Bild-Analyse fehlgeschlagen" });
  }
}
