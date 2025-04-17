// pages/api/barcode.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query;

  if (!code) return res.status(400).json({ error: "Kein Barcode erhalten" });

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
    const data = await response.json();

    if (!data.product) return res.status(404).json({ error: "Produkt nicht gefunden" });

    const p = data.product;
    const n = p.nutriments;

    res.status(200).json({
      name: p.product_name || "Unbekanntes Produkt",
      Kalorien: n["energy-kcal_100g"] || 0,
      Eiweiß: n["proteins_100g"] || 0,
      Fett: n["fat_100g"] || 0,
      Kohlenhydrate: n["carbohydrates_100g"] || 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Fehler bei Produktsuche" });
  }
}
