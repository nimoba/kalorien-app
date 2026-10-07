// pages/api/rezept-generator.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { chat, MODEL_FAST } from "../../lib/openai";

export interface GeneratedRecipe {
  name: string;
  zutaten: {
    name: string;
    menge: number;
    einheit: string;
  }[];
  anleitung: string[];
  nährwerte: {
    kcal: number;
    protein: number;
    fett: number;
    kohlenhydrate: number;
  };
  zubereitungszeit: number;
  schwierigkeit: 'Einfach' | 'Mittel' | 'Schwer';
  portionen: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { verfügbareZutaten, präferenzen } = req.body;

    if (!verfügbareZutaten || verfügbareZutaten.length === 0) {
      return res.status(400).json({ error: 'Keine Zutaten angegeben' });
    }

    // GPT Prompt für Rezept-Generierung
    const prompt = `
Du bist ein deutscher Kochexperte. Erstelle ein Rezept basierend auf den verfügbaren Zutaten.

VERFÜGBARE ZUTATEN:
${verfügbareZutaten.map((z: { name: string; menge: number; einheit: string }) => `- ${z.name} (${z.menge} ${z.einheit})`).join('\n')}

PRÄFERENZEN:
- Zielkalorien: ${präferenzen?.zielKalorien || 'flexibel'}
- Kochzeit: ${präferenzen?.maxZeit || 30} Minuten
- Stil: ${präferenzen?.stil || 'ausgewogen'}
- Allergien/Unverträglichkeiten: ${präferenzen?.allergien || 'keine'}

WICHTIGE REGELN:
1. Verwende NUR die verfügbaren Zutaten (evtl. + Basis-Gewürze wie Salz/Pfeffer)
2. Berechne realistische Nährwerte pro Portion
3. Gib praktische Zubereitungsschritte an
4. Das Rezept soll machbar und lecker sein

Antworte **ausschließlich** im folgenden JSON-Format:

{
  "name": "Rezeptname",
  "zutaten": [
    {
      "name": "Zutat1",
      "menge": 200,
      "einheit": "g"
    }
  ],
  "anleitung": [
    "Schritt 1: ...",
    "Schritt 2: ..."
  ],
  "nährwerte": {
    "kcal": 450,
    "protein": 25,
    "fett": 15,
    "kohlenhydrate": 45
  },
  "zubereitungszeit": 20,
  "schwierigkeit": "Einfach",
  "portionen": 2
}

Gib nur den JSON zurück, keine anderen Texte oder Kommentare.
`;

    const antwort = await chat({
      model: MODEL_FAST,
      reasoning: "low",
      json: "object",
      messages: [
          {
            role: "system",
            content: "Du bist ein deutscher Kochexperte und Ernährungsberater. Du erstellst praktische, leckere Rezepte basierend auf verfügbaren Zutaten und berechnest präzise Nährwerte."
          },
          {
            role: "user",
            content: prompt
          }
        ],
    });


    if (!antwort) {
      console.error("❌ GPT-Antwort leer");
      return res.status(500).json({ error: "Keine Antwort von GPT erhalten" });
    }

    try {
      // JSON-Block extrahieren und parsen
      const cleanedResponse = antwort.replace(/```json|```/g, "").trim();
      const rezept: GeneratedRecipe = JSON.parse(cleanedResponse);

      // Validierung
      if (!rezept.name || !rezept.zutaten || !rezept.anleitung || !rezept.nährwerte) {
        throw new Error("Unvollständiges Rezept erhalten");
      }

      console.log(`🍳 Rezept generiert: ${rezept.name}`);
      res.status(200).json(rezept);
    } catch (parseError) {
      console.error("❌ Fehler beim Parsen der GPT-Antwort:", antwort);
      console.error("Parse Error:", parseError);
      return res.status(500).json({ 
        error: "Rezept konnte nicht verarbeitet werden",
        details: antwort.substring(0, 200)
      });
    }
  } catch (err) {
    console.error("❌ Fehler bei Rezept-Generierung:", err);
    res.status(500).json({ error: "Fehler bei der Rezept-Generierung" });
  }
}