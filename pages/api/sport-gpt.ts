// pages/api/sport-gpt.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { chatJSON, MODEL_PRECISE } from "../../lib/openai";

interface Aktivitaet {
  name: string;
  met: number;
  minuten: number;
}

const SCHEMA = {
  name: "sport_schaetzung",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["aktivitaeten"],
    properties: {
      aktivitaeten: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "met", "minuten"],
          properties: {
            name: { type: "string" },
            met: { type: "number", description: "MET-Wert laut Compendium of Physical Activities (2024), passend zur Intensität" },
            minuten: { type: "number", description: "Aktive Dauer in Minuten" },
          },
        },
      },
    },
  },
};

export default async function schaetzeMitGPT(req: NextApiRequest, res: NextApiResponse) {
  const { beschreibung, gewicht } = req.body || {};
  const kg = Number(gewicht);
  if (!beschreibung || !kg) {
    return res.status(400).json({ error: "Beschreibung und Gewicht sind erforderlich." });
  }

  try {
    const { aktivitaeten } = await chatJSON<{ aktivitaeten: Aktivitaet[] }>({
      model: MODEL_PRECISE,
      reasoning: "low",
      json: SCHEMA,
      messages: [
        {
          role: "developer",
          content: `Du bist Sportwissenschaftler. Zerlege die beschriebene Aktivität in Einzelaktivitäten und gib je den MET-Wert (Compendium of Physical Activities) und die aktive Dauer an.
- Leite die Intensität aus Angaben wie Pace, Geschwindigkeit, Watt, Gewichten oder Puls ab (z. B. 10 km in 50 min = 12 km/h Laufen ≈ 11.5 MET).
- Fehlt die Dauer, schätze sie aus Distanz/Umfang realistisch (bei Krafttraining nur effektive Trainingszeit inkl. Satzpausen).
- Schritte: ca. 100 Schritte/min Gehen bei ~3.5 MET.`,
        },
        { role: "user", content: String(beschreibung) },
      ],
    });

    // Net calories: (MET - 1) × kg × h, so the resting burn already in the TDEE is not counted twice
    const kcal = Math.round(
      (aktivitaeten || []).reduce((sum, a) => sum + Math.max(0, Number(a.met) - 1) * kg * (Number(a.minuten) / 60), 0),
    );
    if (!kcal) return res.status(500).json({ error: "Aktivität konnte nicht interpretiert werden" });

    res.status(200).json({ kcal, aktivitaeten });
  } catch (err) {
    console.error("❌ Fehler bei GPT-Sport-Call:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Fehler bei GPT-Verarbeitung" });
  }
}
