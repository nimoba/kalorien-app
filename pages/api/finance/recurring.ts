import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

function parseDecimal(input: unknown): number {
  if (typeof input === "string") {
    return parseFloat(input.replace(",", "."));
  }
  return typeof input === "number" ? input : NaN;
}

function calculateNextPayment(startDate: string, frequency: string): { nextPayment: string; daysUntil: number } {
  const start = new Date(startDate);
  const now = new Date();
  const next = new Date(start);

  // Find the next payment date
  while (next <= now) {
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }

  const diffTime = next.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    nextPayment: next.toLocaleDateString('de-DE'),
    daysUntil
  };
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
    
    // Ensure the WiederkehrendeZahlungen sheet exists
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        ranges: ["WiederkehrendeZahlungen!A1"],
      });
    } catch {
      // Create the sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "WiederkehrendeZahlungen",
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "WiederkehrendeZahlungen!A1:H1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Name", "Betrag", "Kategorie", "Frequenz", "StartDatum", "EndDatum", "Aktiv", "ID"]],
        },
      });
    }

    // Generate a unique ID
    const paymentId = `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "WiederkehrendeZahlungen!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, amountVal, category, frequency, startDate, endDate || '', active ? 'TRUE' : 'FALSE', paymentId]],
      },
    });

    res.status(200).json({ success: true, id: paymentId });
  } catch (err) {
    console.error("Fehler beim Speichern der wiederkehrenden Zahlung:", err);
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

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "WiederkehrendeZahlungen!A2:H",
      });
    } catch {
      // Sheet doesn't exist yet
      return res.status(200).json([]);
    }

    const rows = response.data.values || [];
    
    const payments = rows.map((row, index) => {
      const startDate = row[4] || '';
      const frequency = row[3] || 'monthly';
      const { nextPayment, daysUntil } = calculateNextPayment(startDate, frequency);

      return {
        id: row[7] || `r_${index}`,
        name: row[0] || '',
        amount: parseFloat(row[1]?.toString() || '0'),
        category: row[2] || '',
        frequency: row[3] as 'weekly' | 'monthly' | 'yearly' || 'monthly',
        startDate: startDate,
        endDate: row[5] || null,
        active: row[6] === 'TRUE',
        nextPayment,
        daysUntilPayment: daysUntil,
      };
    });

    // Filter out expired payments
    const activePayments = payments.filter(payment => {
      if (!payment.endDate) return true;
      const endDate = new Date(payment.endDate);
      const now = new Date();
      return endDate >= now;
    });

    // Sort by next payment date
    activePayments.sort((a, b) => a.daysUntilPayment - b.daysUntilPayment);

    res.status(200).json(activePayments);
  } catch (error) {
    console.error("Error fetching recurring payments:", error);
    res.status(500).json({ error: "Fehler beim Laden der wiederkehrenden Zahlungen" });
  }
}