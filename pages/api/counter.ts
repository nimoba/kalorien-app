import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (req.method === 'GET') {
      // Counter laden
      try {
        const res_data = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId!,
          range: "Counter!A2:B2",
        });

        const values = res_data.data.values;
        const count = values && values[0] && values[0][1] ? parseInt(values[0][1].toString()) : 0;

        console.log(`🔢 Counter geladen: ${count}`);
        return res.status(200).json({ count });

      } catch {
        // Counter-Sheet existiert nicht, erstelle es
        await createCounterSheet(sheets, sheetId!);
        return res.status(200).json({ count: 0 });
      }

    } else if (req.method === 'POST') {
      // Counter speichern
      const { count } = req.body;
      
      if (typeof count !== 'number' || count < 0) {
        return res.status(400).json({ error: 'Ungültiger Counter-Wert' });
      }

      try {
        // Versuche Counter-Sheet zu finden
        await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId!,
          range: "Counter!A1",
        });
      } catch {
        // Erstelle Counter-Sheet wenn es nicht existiert
        await createCounterSheet(sheets, sheetId!);
      }

      // Aktualisiere Counter-Wert
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId!,
        range: "Counter!A2:B2",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Counter", count]]
        }
      });

      console.log(`🔢 Counter gespeichert: ${count}`);
      return res.status(200).json({ success: true, count });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error("❌ Counter API Fehler:", error);
    res.status(500).json({ error: "Counter Fehler" });
  }
}

async function createCounterSheet(sheets: ReturnType<typeof google.sheets>, sheetId: string) {
  try {
    // Erstelle neues Sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: "Counter"
            }
          }
        }]
      }
    });

    // Füge Header und Startwert hinzu
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Counter!A1:B2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Name", "Wert"],
          ["Counter", 0]
        ]
      }
    });

    console.log('📊 Counter-Sheet erstellt');
  } catch (error) {
    console.log('Counter-Sheet bereits vorhanden oder Fehler:', error);
  }
}