import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { stil, kalorienProzent, essensarten, budget, zeit, wochenplan } = req.body;

    // GPT Prompt zusammensetzen
    const prompt = `
Du bist ein deutscher Ernährungsberater. Der Nutzer möchte basierend auf seinen restlichen Kalorien Vorschläge bekommen, um seine Makronährstoffziele zu erreichen.

Essensstil: ${stil}
Budgetfokus: ${budget ? "JA" : "Nein"}
Zeitaufwand: ${zeit}/100
Essensarten: ${essensarten.length > 0 ? essensarten.join(", ") : "flexibel"}
Kalorienbudget: ${kalorienProzent}% des Tagesbedarfs (z. B. ca. ${Math.round((kalorienProzent / 100) * 2200)} kcal)

${wochenplan
  ? `⚠️ Der Nutzer möchte einen kompletten Wochenplan (7 Tage). Achte darauf, dass Zutaten effizient verwendet werden. Beispiel: Wenn Paprika, Brokkoli oder Linsen in einem Rezept vorkommen, nutze Reste in anderen Gerichten weiter. 
Beachte typische Supermarkt-Packungsgrößen (z. B. 3 Paprika-Packung, 500g Nudeln, 200g Feta).`
  : `Der Nutzer möchte nur 1–2 Vorschläge für heute.`}

Deine Antwort soll **ausschließlich im folgenden JSON-Format** erfolgen:

${
  wochenplan
    ? `{
  "tage": [
    {
      "tag": "Montag",
      "gerichte": [
        {
          "gericht": "Gemüsepfanne mit Tofu",
          "zutaten": ["Paprika", "Zucchini", "Tofu", "Reis"],
          "rezept": "Alles anbraten, mit Sojasoße ablöschen.",
          "makros": { "kcal": 620, "eiweiss": 28, "fett": 22, "kh": 65 },
          "preis": "ca. 2.90 €"
        }
      ]
    },
    ...
  ]
}`
    : `[{
  "gericht": "Reis mit Gemüse und Erdnusssauce",
  "zutaten": ["Reis", "Brokkoli", "Paprika", "Erdnussbutter"],
  "rezept": "Gemüse dünsten, Erdnusssauce zubereiten, alles mischen.",
  "makros": { "kcal": 550, "eiweiss": 18, "fett": 19, "kh": 65 },
  "preis": "ca. 3.00 €"
}]`
}
Gib **nur den JSON-Code zurück**, keine Kommentare, keine Erklärung.
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
