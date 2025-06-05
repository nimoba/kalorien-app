import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Gewichtsdaten aus der Gewicht-Tabelle laden (jetzt mit Wasser in Spalte E)
    const gewichtData = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Gewicht!A2:E", // Erweitert um Spalte E für Wasser
    });

    const gewichtRows = gewichtData.data.values || [];
    
    // Daten der letzten 30 Tage filtern und strukturieren
    const heute = new Date();
    const vor30Tagen = new Date(heute.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const result = gewichtRows
      .map(row => {
        const [datum, gewicht, fett, muskel, wasser] = row;
        if (!datum || !gewicht) return null;
        
        // Datum parsen (Format: DD.MM.YYYY)
        const [tag, monat, jahr] = datum.split('.');
        const entryDate = new Date(parseInt(jahr), parseInt(monat) - 1, parseInt(tag));
        
        // Nur Einträge der letzten 30 Tage
        if (entryDate < vor30Tagen) return null;
        
        return {
          datum,
          gewicht: Number(gewicht) || 0,
          fett: fett ? Number(fett) : null,
          muskel: muskel ? Number(muskel) : null,
          wasser: wasser ? Number(wasser) : null,
        };
      })
      .filter(Boolean) // null-Werte entfernen
      .sort((a, b) => {
        // Nach Datum sortieren
        const [tagA, monatA, jahrA] = a!.datum.split('.').map(Number);
        const [tagB, monatB, jahrB] = b!.datum.split('.').map(Number);
        const dateA = new Date(jahrA, monatA - 1, tagA);
        const dateB = new Date(jahrB, monatB - 1, tagB);
        return dateA.getTime() - dateB.getTime();
      });

    res.status(200).json(result);
  } catch (err) {
    console.error("Fehler beim Laden der Gewichtskomponenten:", err);
    res.status(500).json({ error: "Fehler beim Abrufen der Gewichtskomponenten" });
  }
}