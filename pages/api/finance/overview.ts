import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

interface Transaction {
  id: string;
  date: string;
  time: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  notes?: string;
}

interface FinanceSettings {
  startingBalance: number;
  currency: string;
  monthlyBudget: number;
}

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
    let transactionsResponse;
    try {
      transactionsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Transaktionen!A2:H",
      });
    } catch {
      // Create Transaktionen sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Transaktionen",
                },
              },
            },
          ],
        },
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Transaktionen!A1:H1",
        valueInputOption: "RAW",
        requestBody: {
          values: [["Datum", "Zeit", "Beschreibung", "Betrag", "Kategorie", "Typ", "Notizen", "ID"]],
        },
      });

      transactionsResponse = { data: { values: [] } };
    }

    // Get settings
    let settingsResponse;
    try {
      settingsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzEinstellungen!A2:C2",
      });
    } catch {
      // Create FinanzEinstellungen sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "FinanzEinstellungen",
                },
              },
            },
          ],
        },
      });

      // Add headers and default values
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzEinstellungen!A1:C2",
        valueInputOption: "RAW",
        requestBody: {
          values: [
            ["Startguthaben", "Währung", "Monatsbudget"],
            [0, "EUR", 0]
          ],
        },
      });

      settingsResponse = { data: { values: [[0, 'EUR', 0]] } };
    }

    const transactionRows = transactionsResponse.data.values || [];
    const settingsRow = settingsResponse.data.values?.[0] || [0, 'EUR', 0];

    const settings: FinanceSettings = {
      startingBalance: parseFloat(settingsRow[0]?.toString() || '0'),
      currency: settingsRow[1]?.toString() || 'EUR',
      monthlyBudget: parseFloat(settingsRow[2]?.toString() || '0'),
    };

    // Parse transactions
    const transactions: Transaction[] = transactionRows.map((row, index) => ({
      id: `t_${index}`,
      date: row[0] || '',
      time: row[1] || '',
      description: row[2] || '',
      amount: parseFloat(row[3]?.toString() || '0'),
      category: row[4] || '',
      type: row[5] as 'income' | 'expense' || 'expense',
      notes: row[6] || '',
    }));

    // Calculate current balance
    const transactionTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = settings.startingBalance + transactionTotal;

    // Calculate monthly stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date.split('.').reverse().join('-'));
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear;
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate quick stats
    const today = now.toLocaleDateString('de-DE');
    const todayExpenses = transactions
      .filter(t => t.date === today && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.date.split('.').reverse().join('-'));
        return transactionDate >= weekStart && 
               transactionDate <= now && 
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Get recent transactions (last 10)
    const recentTransactions = transactions
      .sort((a, b) => {
        const dateA = new Date(`${a.date.split('.').reverse().join('-')}T${a.time}:00`);
        const dateB = new Date(`${b.date.split('.').reverse().join('-')}T${b.time}:00`);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10);

    const overview = {
      currentBalance,
      monthlyIncome,
      monthlyExpenses,
      todayExpenses,
      weekExpenses,
      monthExpenses: monthlyExpenses,
      recentTransactions,
    };

    res.status(200).json(overview);
  } catch (error) {
    console.error("Error fetching finance overview:", error);
    res.status(500).json({ error: "Fehler beim Laden der Finanzdaten" });
  }
}