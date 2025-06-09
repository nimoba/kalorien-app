// pages/api/zutaten.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export interface Zutat {
  name: string;
  kategorie: string;
  verfügbar: boolean;
  menge?: string;
  einheit?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getZutaten(res);
  } else if (req.method === 'POST') {
    return await updateZutaten(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getZutaten(res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Versuche Zutaten-Tab zu lesen, falls er existiert
    try {
      const zutatenRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "Zutaten!A2:E", // A=Name, B=Kategorie, C=Verfügbar, D=Menge, E=Einheit
      });

      const rows = zutatenRes.data.values || [];
      
      const zutaten: Zutat[] = rows.map(row => ({
        name: row[0] || '',
        kategorie: row[1] || 'Sonstiges',
        verfügbar: row[2] === 'TRUE' || row[2] === '1' || row[2] === 'verfügbar',
        menge: row[3] || '',
        einheit: row[4] || 'Stück',
      })).filter(z => z.name);

      console.log(`📋 ${zutaten.length} Zutaten geladen`);
      res.status(200).json(zutaten);
    } catch {
      // Zutaten-Tab existiert noch nicht, Standard-Zutaten zurückgeben
      console.log("📝 Zutaten-Tab existiert noch nicht, verwende Standard-Zutaten");
      res.status(200).json(getDefaultZutaten());
    }
  } catch (err) {
    console.error("❌ Fehler beim Laden der Zutaten:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Zutaten" });
  }
}

async function updateZutaten(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { zutaten } = req.body as { zutaten: Zutat[] };

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Konvertiere Zutaten zu Sheet-Format
    const values = [
      ['Name', 'Kategorie', 'Verfügbar', 'Menge', 'Einheit'], // Header
      ...zutaten.map(z => [
        z.name,
        z.kategorie,
        z.verfügbar ? 'TRUE' : 'FALSE',
        z.menge || '',
        z.einheit || 'Stück'
      ])
    ];

    // Erst mal versuchen zu überschreiben, falls Tab existiert
    try {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Zutaten!A1:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
    } catch {
      // Tab existiert nicht, erstelle ihn
      console.log("📝 Erstelle Zutaten-Tab");
      
      // Füge neuen Tab hinzu
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "Zutaten"
              }
            }
          }]
        }
      });

      // Füge Daten hinzu
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Zutaten!A1:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values },
      });
    }

    console.log(`✅ ${zutaten.length} Zutaten gespeichert`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Fehler beim Speichern der Zutaten:", err);
    res.status(500).json({ error: "Fehler beim Speichern der Zutaten" });
  }
}

function getDefaultZutaten(): Zutat[] {
  return [
    // Proteine
    { name: 'Eier', kategorie: 'Proteine', verfügbar: false, menge: '', einheit: 'Stück' },
    { name: 'Hähnchenbrust', kategorie: 'Proteine', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Lachs', kategorie: 'Proteine', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Tofu', kategorie: 'Proteine', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Thunfisch', kategorie: 'Proteine', verfügbar: false, menge: '', einheit: 'Dose' },
    { name: 'Quark', kategorie: 'Proteine', verfügbar: false, menge: '', einheit: 'g' },
    
    // Gemüse
    { name: 'Paprika', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'Stück' },
    { name: 'Brokkoli', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Zwiebeln', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'Stück' },
    { name: 'Knoblauch', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'Zehen' },
    { name: 'Tomaten', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'Stück' },
    { name: 'Spinat', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Karotten', kategorie: 'Gemüse', verfügbar: false, menge: '', einheit: 'Stück' },
    
    // Kohlenhydrate
    { name: 'Reis', kategorie: 'Kohlenhydrate', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Nudeln', kategorie: 'Kohlenhydrate', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Kartoffeln', kategorie: 'Kohlenhydrate', verfügbar: false, menge: '', einheit: 'Stück' },
    { name: 'Vollkornbrot', kategorie: 'Kohlenhydrate', verfügbar: false, menge: '', einheit: 'Scheiben' },
    { name: 'Haferflocken', kategorie: 'Kohlenhydrate', verfügbar: false, menge: '', einheit: 'g' },
    
    // Milchprodukte
    { name: 'Milch', kategorie: 'Milchprodukte', verfügbar: false, menge: '', einheit: 'ml' },
    { name: 'Käse', kategorie: 'Milchprodukte', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Joghurt', kategorie: 'Milchprodukte', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Butter', kategorie: 'Milchprodukte', verfügbar: false, menge: '', einheit: 'g' },
    
    // Gewürze & Sonstiges
    { name: 'Olivenöl', kategorie: 'Fette & Öle', verfügbar: false, menge: '', einheit: 'ml' },
    { name: 'Salz', kategorie: 'Gewürze', verfügbar: false, menge: '', einheit: 'Prise' },
    { name: 'Pfeffer', kategorie: 'Gewürze', verfügbar: false, menge: '', einheit: 'Prise' },
    { name: 'Basilikum', kategorie: 'Gewürze', verfügbar: false, menge: '', einheit: 'g' },
    { name: 'Zitrone', kategorie: 'Obst', verfügbar: false, menge: '', einheit: 'Stück' },
  ];
}