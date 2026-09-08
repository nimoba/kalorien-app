import type { NextApiRequest, NextApiResponse } from "next";
import { getSheets, SHEET_ID } from "../../lib/sheets";
import { loadTracking, summarizeDay, dateKeyForISO } from "../../lib/tracking";

interface Kontext {
  zielKcal: number;
  gegessen: number;
  restKcal: number;
  restProtein: number;
  restKh: number;
  restFett: number;
  budgetKcal: number;
  zutaten: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { stil, kalorienProzent, essensarten, budget, zeit, wochenplan, nutzeKuehlschrank } = req.body || {};
    const prozent = Math.min(100, Math.max(10, Number(kalorienProzent) || 100));

    // Real context: today's remaining budget and, optionally, available ingredients
    const sheets = getSheets(true);
    const data = await loadTracking(sheets);
    const tag = summarizeDay(data, dateKeyForISO());

    let zutaten: string[] = [];
    if (nutzeKuehlschrank) {
      try {
        const z = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID(), range: "Zutaten!A2:E" });
        zutaten = (z.data.values || [])
          .filter((r) => r[0] && (r[2] === 'TRUE' || r[2] === '1' || r[2] === 'verfügbar'))
          .map((r) => (r[3] ? `${r[0]} (${r[3]} ${r[4] || ''})`.trim() : String(r[0])));
      } catch {
        zutaten = [];
      }
    }

    const restKcal = Math.round(tag.zielKcal - tag.kcal);
    const restProtein = Math.round(tag.zielEiweiss - tag.eiweiss);
    const restKh = Math.round(tag.zielKh - tag.kh);
    const restFett = Math.round(tag.zielFett - tag.fett);

    // For a weekly plan use the full daily goal; for today use what's left (fallback to goal if nothing is left)
    const basis = wochenplan || restKcal <= 150 ? data.ziele.kcal : restKcal;
    const budgetKcal = Math.round(basis * (prozent / 100));

    const kontext: Kontext = { zielKcal: tag.zielKcal, gegessen: Math.round(tag.kcal), restKcal, restProtein, restKh, restFett, budgetKcal, zutaten };

    const mealList = Array.isArray(essensarten) && essensarten.length > 0 ? essensarten.join(", ") : "flexibel";
    const prompt = `
Du bist ein deutscher Ernährungsberater. Der Nutzer trackt Kalorien und Makros und möchte konkrete Essensvorschläge.

${wochenplan ? `AUFGABE: Ein kompletter Wochenplan (7 Tage, Montag bis Sonntag) mit je 2 bis 3 Gerichten pro Tag.
Tagesziel: ca. ${data.ziele.kcal} kcal, ${data.ziele.eiweiss} g Protein, ${data.ziele.kh} g Kohlenhydrate, ${data.ziele.fett} g Fett.
Verwende ${budgetKcal} kcal pro Tag für die geplanten Gerichte.
Nutze Zutaten über mehrere Tage effizient (typische Packungsgrößen: 3er Paprika, 500 g Nudeln, 200 g Feta usw.).`
: `AUFGABE: 2 bis 3 Vorschläge für heute.
Heute bereits gegessen: ${kontext.gegessen} kcal von ${kontext.zielKcal} kcal.
Noch übrig: ${restKcal} kcal, ${restProtein} g Protein, ${restKh} g Kohlenhydrate, ${restFett} g Fett.
Die Vorschläge sollen jeweils etwa ${budgetKcal} kcal haben und vor allem die fehlenden Makros abdecken (besonders Protein, falls dort viel fehlt).`}

Ernährungsstil: ${stil === 'vegetarisch' ? 'vegetarisch' : 'alles erlaubt'}
Mahlzeiten: ${mealList}
Budgetfokus: ${budget ? 'ja, günstige Zutaten bevorzugen' : 'nein'}
Maximale Zubereitungszeit: ${Number(zeit) || 30} Minuten
${zutaten.length > 0 ? `Verfügbare Zutaten (bevorzugt verwenden, Basics wie Öl, Salz, Gewürze dürfen ergänzt werden): ${zutaten.join(', ')}` : ''}

Antworte ausschließlich mit JSON, ohne Kommentare oder Markdown:
${wochenplan
  ? `{"tage":[{"tag":"Montag","gerichte":[{"gericht":"…","zutaten":["…"],"rezept":"…","makros":{"kcal":0,"eiweiss":0,"fett":0,"kh":0},"preis":"ca. 2.90 €","zeit":20}]}]}`
  : `{"vorschlaege":[{"gericht":"…","zutaten":["…"],"rezept":"…","makros":{"kcal":0,"eiweiss":0,"fett":0,"kh":0},"preis":"ca. 3.00 €","zeit":20}]}`}
`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Du bist ein deutscher Ernährungsberater. Antworte nur mit gültigem JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const json = await gptRes.json();
    const antwort: string = json.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(antwort.replace(/```json|```/g, "").trim());

    // Normalise: older prompts returned a bare array
    const vorschlaege = Array.isArray(parsed) ? parsed : parsed.vorschlaege;
    res.status(200).json({ kontext, vorschlaege: wochenplan ? undefined : vorschlaege || [], tage: wochenplan ? parsed.tage || [] : undefined });
  } catch (err) {
    console.error("Fehler bei Essensvorschlag:", err);
    res.status(500).json({ error: "Empfehlung konnte nicht erstellt werden" });
  }
}
