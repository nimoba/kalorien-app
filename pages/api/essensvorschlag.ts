import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { stil, kalorienProzent, essensarten, budget, zeit } = req.body;

    // GPT Prompt zusammensetzen
    const prompt = `
Du bist ein Ernährungsberater in Deutschland. Der Nutzer möchte auf Basis seiner noch übrigen Kalorien eine passende Mahlzeit (oder mehrere kleine) planen.

🔢 Nutzbare Kalorien: ${kalorienProzent}% des Tagesbedarfs (z. B. bei 2200 kcal wären das ${Math.round((kalorienProzent / 100) * 2200)} kcal)
🍳 Essensarten: ${essensarten.length > 0 ? essensarten.join(", ") : "beliebig"}
🌱 Stil: ${stil === "vegetarisch" ? "vegetarisch, keine tierischen Produkte außer Milch, Käse, Eier" : "alles erlaubt"}
💸 On a Budget: ${budget ? "ja" : "nein"}
⏱️ Zeitaufwand: ${zeit}/100 (je höher, desto mehr Kochaufwand ist akzeptabel)

💡 Ziel: Mache dem Nutzer eine sinnvolle Empfehlung, was er essen könnte, um seine Makronährstoffziele zu erreichen. 

Gib die Antwort **im folgenden JSON-Format** zurück (als Array mit 1–2 Vorschlägen):
[
  {
    "gericht": "Bowl mit Quinoa und gebratenem Gemüse",
    "zutaten": ["Quinoa", "Paprika", "Zucchini", "Feta", "Olivenöl"],
    "rezept": "Quinoa kochen. Gemüse anbraten. Alles in einer Bowl anrichten und mit Feta bestreuen.",
    "makros": {
      "kcal": 650,
      "eiweiss": 25,
      "fett": 22,
      "kh": 65
    },
    "preis": "ca. 3.20 €"
  }
]
Gib nur das JSON zurück – keine Erklärungen, keine Formatierung, keine Kommentare.
`;

    const gptRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "Du bist ein deutscher Ernährungsberater. Antworte nur im JSON-Format wie beschrieben.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    const json = await gptRes.json();
    let antwort = json.choices?.[0]?.message?.content || "";

    // JSON-Block extrahieren
    const clean = antwort.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    console.error("Fehler bei Essensvorschlag:", err);
    res.status(500).json({ error: "GPT-Antwort konnte nicht verarbeitet werden" });
  }
}
