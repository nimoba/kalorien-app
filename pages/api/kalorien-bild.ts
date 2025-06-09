import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Kein Bild erhalten" });
  }

  // Validate base64 image format
  if (typeof image !== 'string' || !image.trim()) {
    return res.status(400).json({ error: "Ungültiges Bildformat" });
  }

  console.log('📸 Bild-API aufgerufen, Bildgröße:', image.length);

  const prompt = `
Du siehst ein Bild von einem Gericht.

Bitte schätze:
- was es ist (Name),
- die Kalorien und Makros **pro 100g/ml**,
- und die geschätzte Gesamtmenge in g oder ml.

Antworte **nur** im folgenden JSON-Format:

{
  "name": "Beispielgericht",
  "kcal": 230,
  "eiweiss": 8,
  "fett": 12,
  "kh": 20,
  "menge": 350
}
`;

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API Key nicht konfiguriert');
    return res.status(500).json({ error: 'OpenAI API nicht konfiguriert' });
  }

  try {
    console.log('📸 Sende Anfrage an OpenAI Vision API...');
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

    console.log('📸 OpenAI Response Status:', openaiRes.status);
    
    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      console.error('❌ OpenAI API Fehler:', errorText);
      return res.status(500).json({ 
        error: 'OpenAI API Fehler', 
        details: openaiRes.status === 401 ? 'Ungültiger API Key' : `Status ${openaiRes.status}` 
      });
    }

    const json = await openaiRes.json();
    console.log('📸 OpenAI Antwort erhalten:', JSON.stringify(json, null, 2));
    
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      console.error("❌ GPT-Antwort ohne content:", JSON.stringify(json, null, 2));
      return res.status(500).json({ error: "GPT-Antwort ohne content erhalten." });
    }
    
    console.log('📸 GPT Content:', content);

    try {
      const cleaned = content.replace(/```json|```/g, "").trim();
      console.log('📸 Bereinigter JSON:', cleaned);
      const parsed = JSON.parse(cleaned);
      console.log('📸 Geparste Daten:', parsed);
      return res.status(200).json(parsed);
    } catch (parseError) {
      console.error("❌ Fehler beim Parsen der GPT-Antwort:", content);
      console.error('❌ Parse Error:', parseError);
      return res.status(500).json({ 
        error: "Antwort war kein gültiges JSON.",
        raw_content: content.substring(0, 200)
      });
    }
  } catch (error) {
    console.error("❌ Fehler bei Anfrage an OpenAI:", error);
    return res.status(500).json({ error: "Fehler bei GPT-Anfrage." });
  }
}
