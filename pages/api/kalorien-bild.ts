import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Kein Bild erhalten" });
  }

  const prompt = `
Du siehst ein Bild von einem Gericht.
Bitte schätze realistisch, was es ist, und gib folgendes im JSON-Format zurück:

{
  "name": "Beispielgericht",
  "kcal": 540,
  "eiweiss": 25,
  "fett": 20,
  "kh": 60
}

Antworte ausschließlich im JSON-Format. Keine Erklärungen.
`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "Du bist ein Ernährungsexperte. Du kannst aus einem Bild grob die Nährwerte und das Gericht schätzen.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
            ],
          },
        ],
      }),
    });

    const json = await openaiRes.json();

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      console.error("❌ GPT-Antwort ohne content:", JSON.stringify(json, null, 2));
      return res.status(500).json({ error: "GPT-Antwort ohne content erhalten." });
    }

    try {
        const cleaned = content.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);        
      return res.status(200).json(parsed);
    } catch (e) {
      console.error("❌ Fehler beim Parsen der GPT-Antwort:", content);
      return res.status(500).json({ error: "Antwort war kein gültiges JSON." });
    }
  } catch (error) {
    console.error("❌ Fehler bei Anfrage an OpenAI:", error);
    return res.status(500).json({ error: "Fehler bei GPT-Anfrage." });
  }
}
