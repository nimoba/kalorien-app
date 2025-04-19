// pages/api/sport-gpt.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default async function schaetzeMitGPT(req: NextApiRequest, res: NextApiResponse) {
    console.log("💡 GPT-Schätzung gestartet");
    const { beschreibung, gewicht } = req.body;

  if (!beschreibung || !gewicht) {
    return res.status(400).json({ error: "Beschreibung und Gewicht sind erforderlich." });
  }

  const prompt = `
Ich wiege ${gewicht} kg.
Ich habe folgendes gemacht: ${beschreibung}.

Schätze realistisch, wie viele Kalorien ich dadurch verbraucht habe.

❗ Antworte bitte **nur mit einer Zahl**, ohne Einheit oder Text.
`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "Du bist ein Sportwissenschaftler und Experte für Kalorienverbrauchsschätzung.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    const gptJson = await openaiRes.json();
    const raw = gptJson.choices?.[0]?.message?.content?.trim() || "";
    const kcal = parseFloat(raw.replace(/[^\d.]/g, ""));

    if (isNaN(kcal)) {
      return res.status(500).json({ error: "Antwort konnte nicht interpretiert werden", raw });
    }

    res.status(200).json({ kcal });
  } catch (err) {
    console.error("❌ Fehler bei GPT-Sport-Call:", err);
    res.status(500).json({ error: "Fehler bei GPT-Verarbeitung" });
  }
}
