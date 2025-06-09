// pages/api/einkaufsliste.ts
import type { NextApiRequest, NextApiResponse } from "next";

export interface EinkaufsItem {
  name: string;
  menge: number;
  einheit: string;
  kategorie: string;
  dringlichkeit: 'hoch' | 'mittel' | 'niedrig';
  geschätzerPreis?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fehlende_zutaten, budget, präferenzen } = req.body;

    if (!fehlende_zutaten || fehlende_zutaten.length === 0) {
      return res.status(400).json({ error: 'Keine fehlenden Zutaten angegeben' });
    }

    // GPT Prompt für intelligente Einkaufsliste
    const prompt = `
Du bist ein Einkaufsexperte und hilfst beim Erstellen von optimierten Einkaufslisten.

FEHLENDE ZUTATEN FÜR REZEPTE:
${fehlende_zutaten.map((z: { name: string; benötigte_menge: number; einheit: string }) => `- ${z.name} (benötigt: ${z.benötigte_menge} ${z.einheit})`).join('\n')}

BUDGET: ${budget ? `${budget}€` : 'flexibel'}
PRÄFERENZEN:
- Geschäft: ${präferenzen?.geschäft || 'Supermarkt'}
- Bio: ${präferenzen?.bio ? 'Ja' : 'Nein'}
- Marken: ${präferenzen?.marken || 'flexibel'}

AUFGABE:
1. Erstelle eine optimierte Einkaufsliste
2. Berücksichtge typische Verpackungsgrößen (z.B. 500g Nudeln, nicht 67g)
3. Gruppiere nach Supermarkt-Kategorien
4. Schätze realistische Preise (deutsche Supermärkte)
5. Priorisiere nach Dringlichkeit

WICHTIGE REGELN:
- Kaufe sinnvolle Mengen (nicht exakt benötigte Menge)
- Berücksichtige, dass Reste für andere Rezepte verwendet werden können
- Hochwertige Basis-Zutaten haben Priorität
- Gewürze/Öle sind langfristige Investitionen

Antworte **ausschließlich** im folgenden JSON-Format:

{
  "einkaufsliste": [
    {
      "name": "Olivenöl Extra Virgin",
      "menge": 500,
      "einheit": "ml",
      "kategorie": "Öle & Essig",
      "dringlichkeit": "hoch",
      "geschätzerPreis": 4.99
    }
  ],
  "gesamtpreis": 45.67,
  "kategorien": [
    {
      "name": "Gemüse & Obst",
      "items": 5,
      "preis": 12.50
    }
  ],
  "tipps": [
    "Kaufe Bio-Olivenöl - bessere Qualität für wenig Aufpreis",
    "Gefrorenes Gemüse ist günstiger und hält länger"
  ]
}

Gib nur den JSON zurück, keine anderen Texte.
`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.6,
        messages: [
          {
            role: "system",
            content: "Du bist ein Einkaufsexperte mit Kenntnissen über deutsche Supermärkte, Preise und optimale Mengen für Haushalte."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    const gptJson = await gptRes.json();
    const antwort = gptJson.choices?.[0]?.message?.content || "";

    if (!antwort) {
      console.error("❌ GPT-Antwort leer:", gptJson);
      return res.status(500).json({ error: "Keine Antwort von GPT erhalten" });
    }

    try {
      // JSON-Block extrahieren und parsen
      const cleanedResponse = antwort.replace(/```json|```/g, "").trim();
      const einkaufsliste = JSON.parse(cleanedResponse);

      // Validierung
      if (!einkaufsliste.einkaufsliste || !Array.isArray(einkaufsliste.einkaufsliste)) {
        throw new Error("Ungültige Einkaufsliste erhalten");
      }

      console.log(`🛒 Einkaufsliste mit ${einkaufsliste.einkaufsliste.length} Items generiert`);
      res.status(200).json(einkaufsliste);
    } catch (parseError) {
      console.error("❌ Fehler beim Parsen der GPT-Antwort:", antwort);
      console.error("Parse Error:", parseError);
      return res.status(500).json({ 
        error: "Einkaufsliste konnte nicht verarbeitet werden",
        details: antwort.substring(0, 200)
      });
    }
  } catch (err) {
    console.error("❌ Fehler bei Einkaufsliste-Generierung:", err);
    res.status(500).json({ error: "Fehler bei der Einkaufsliste-Generierung" });
  }
}