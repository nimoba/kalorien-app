import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") {
    return parseFloat(input.replace(",", "."));
  }
  return typeof input === "number" ? input : NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "PUT") {
    return handleUpdate(req, res, id as string);
  } else if (req.method === "DELETE") {
    return handleDelete(req, res, id as string);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse, id: string) {
  const { name, amount, category, frequency, startDate, endDate, active } = req.body;

  const amountVal = parseDecimal(amount);

  if (!name || isNaN(amountVal) || !category || !frequency) {
    return res.status(400).json({ error: "Ungültige oder unvollständige Daten" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Get all recurring payments to find the row to update
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "WiederkehrendeZahlungen!A2:H",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[7] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Wiederkehrende Zahlung nicht gefunden" });
    }

    // Update the specific row (add 2 to account for header and 0-based index)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `WiederkehrendeZahlungen!A${rowIndex + 2}:H${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, amountVal, category, frequency, startDate, endDate || '', active ? 'TRUE' : 'FALSE', id]],
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Aktualisieren der wiederkehrenden Zahlung:", err);
    res.status(500).json({ error: "Aktualisieren fehlgeschlagen" });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Get all recurring payments to find the row to delete
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "WiederkehrendeZahlungen!A2:H",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[7] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Wiederkehrende Zahlung nicht gefunden" });
    }

    // Delete the row (add 2 to account for header and 0-based index)
    const sheetRowIndex = rowIndex + 2;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await getSheetId(sheets, "WiederkehrendeZahlungen"),
              dimension: "ROWS",
              startIndex: sheetRowIndex - 1,
              endIndex: sheetRowIndex,
            }
          }
        }]
      }
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Fehler beim Löschen der wiederkehrenden Zahlung:", err);
    res.status(500).json({ error: "Löschen fehlgeschlagen" });
  }
}

async function getSheetId(sheets: any, sheetName: string): Promise<number> {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
  });

  const sheet = spreadsheet.data.sheets?.find((s: any) => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId || 0;
}