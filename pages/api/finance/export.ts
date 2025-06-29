import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Get transactions
    const transactionsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Transaktionen!A1:H",
    });

    const rows = transactionsResponse.data.values || [];
    
    // Convert to CSV
    const csv = rows.map(row => {
      // Escape commas and quotes in the data
      return row.map(cell => {
        const cellStr = (cell || '').toString();
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',');
    }).join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const csvWithBOM = '\uFEFF' + csv;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="finanzen-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(200).send(csvWithBOM);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ error: "Export fehlgeschlagen" });
  }
}