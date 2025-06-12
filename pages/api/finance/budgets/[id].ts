import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "DELETE") {
    return handleDelete(req, res, id as string);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "FinanzBudgets!A2:D",
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[3] === id);

    if (rowIndex === -1) {
      return res.status(404).json({ error: "Budget nicht gefunden" });
    }

    const sheetRowIndex = rowIndex + 2;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: await getSheetId(sheets, "FinanzBudgets"),
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
    console.error("Fehler beim Löschen des Budgets:", err);
    res.status(500).json({ error: "Löschen fehlgeschlagen" });
  }
}

async function getSheetId(sheets: ReturnType<typeof google.sheets>, sheetName: string): Promise<number> {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
  });

  const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName);
  return sheet?.properties?.sheetId || 0;
}