import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") {
    return parseFloat(input.replace(",", "."));
  }
  return typeof input === "number" ? input : NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    return handleSave(req, res);
  } else if (req.method === "GET") {
    return handleGet(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleSave(req: NextApiRequest, res: NextApiResponse) {
  const { startingBalance, currency, monthlyBudget } = req.body;

  const startingBalanceVal = parseDecimal(startingBalance);
  const monthlyBudgetVal = parseDecimal(monthlyBudget) || 0;

  if (isNaN(startingBalanceVal)) {
    return res.status(400).json({ error: "Ungültiger Startsaldo" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    // Ensure the FinanzEinstellungen sheet exists
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        ranges: ["FinanzEinstellungen!A1"],
      });
    } catch {
      // Create the sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "FinanzEinstellungen",
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzEinstellungen!A1:C1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Startsaldo", "Währung", "Monatsbudget"]],
        },
      });
    }

    // Update or create settings row
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "FinanzEinstellungen!A2:C2",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[startingBalanceVal, currency || 'EUR', monthlyBudgetVal]],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Speichern der Einstellungen:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzEinstellungen!A2:C2",
      });
    } catch {
      // Settings don't exist yet, return defaults
      return res.status(200).json({
        startingBalance: 0,
        currency: 'EUR',
        monthlyBudget: 0,
      });
    }

    const row = response.data.values?.[0] || [0, 'EUR', 0];

    const settings = {
      startingBalance: parseFloat(row[0]?.toString() || '0'),
      currency: row[1]?.toString() || 'EUR',
      monthlyBudget: parseFloat(row[2]?.toString() || '0'),
    };

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Fehler beim Laden der Einstellungen" });
  }
}