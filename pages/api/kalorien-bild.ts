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

Antwort nur im JSON-Format, keine weiteren Erklärungen.
`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Du bist ein Ernährungsexperte. Der Experte darin ist durch einen einfachen Blick, die Nährwerte eines Essens zuerkennen." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ],
        },
      ],
    }),
  });

  const json = await openaiRes.json();
  try {
    const content = json.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    res.status(200).json(parsed);
  } catch (e) {
    console.error("Fehler bei GPT-Antwort:", json);
    res.status(500).json({ error: "Fehler bei der Analyse der GPT-Antwort" });
  }
}
