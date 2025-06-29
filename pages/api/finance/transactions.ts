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
    return handleCreate(req, res);
  } else if (req.method === "GET") {
    return handleList(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { description, amount, category, type, notes, date, time } = req.body;

  const amountVal = parseDecimal(amount);

  if (!description || isNaN(amountVal) || !category || !type) {
    return res.status(400).json({ error: "Ungültige oder unvollständige Daten" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    
    // Ensure the Transaktionen sheet exists
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        ranges: ["Transaktionen!A1"],
      });
    } catch {
      // Create the sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "Transaktionen",
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Transaktionen!A1:H1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Datum", "Uhrzeit", "Beschreibung", "Betrag", "Kategorie", "Typ", "Notizen", "ID"]],
        },
      });
    }

    const finalDate = date || new Date().toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
    const finalTime = time || new Date().toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate a unique ID
    const transactionId = `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Transaktionen!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[finalDate, finalTime, description, amountVal, category, type, notes || '', transactionId]],
      },
    });

    res.status(200).json({ success: true, id: transactionId });
  } catch (err) {
    console.error("Fehler beim Speichern der Transaktion:", err);
    res.status(500).json({ error: "Speichern fehlgeschlagen" });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Transaktionen!A2:H",
    });

    const rows = response.data.values || [];
    
    const transactions = rows.map((row, index) => ({
      id: row[7] || `t_${index}`,
      date: row[0] || '',
      time: row[1] || '',
      description: row[2] || '',
      amount: parseFloat(row[3]?.toString() || '0'),
      category: row[4] || '',
      type: row[5] as 'income' | 'expense' || 'expense',
      notes: row[6] || '',
    }));

    // Sort by date and time (newest first)
    transactions.sort((a, b) => {
      const dateA = new Date(`${a.date.split('.').reverse().join('-')}T${a.time}:00`);
      const dateB = new Date(`${b.date.split('.').reverse().join('-')}T${b.time}:00`);
      return dateB.getTime() - dateA.getTime();
    });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Fehler beim Laden der Transaktionen" });
  }
}