import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    return handleList(req, res);
  } else if (req.method === "POST") {
    return handleCreate(req, res);
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}

async function handleList(req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Get budgets and current month expenses
    const [budgetsRes, transactionsRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzBudgets!A2:D",
      }).catch(() => ({ data: { values: [] } })),
      sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Transaktionen!A2:H",
      }).catch(() => ({ data: { values: [] } }))
    ]);

    const budgetRows = budgetsRes.data.values || [];
    const transactionRows = transactionsRes.data.values || [];

    // Calculate current month expenses by category
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyExpenses: { [key: string]: number } = {};
    
    transactionRows.forEach(row => {
      const date = row[0];
      const amount = parseFloat(row[3]?.toString() || '0');
      const category = row[4] || '';
      const type = row[5] || '';

      if (type === 'expense' && date) {
        const transactionDate = new Date(date.split('.').reverse().join('-'));
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          monthlyExpenses[category] = (monthlyExpenses[category] || 0) + Math.abs(amount);
        }
      }
    });

    const budgets = budgetRows.map((row, index) => {
      const category = row[0] || '';
      const monthlyLimit = parseFloat(row[1]?.toString() || '0');
      const currentSpent = monthlyExpenses[category] || 0;
      const percentage = monthlyLimit > 0 ? (currentSpent / monthlyLimit) * 100 : 0;

      return {
        id: row[3] || `b_${index}`,
        category,
        monthlyLimit,
        currentSpent,
        percentage,
      };
    });

    res.status(200).json(budgets);
  } catch (error) {
    console.error("Error fetching budgets:", error);
    res.status(500).json({ error: "Fehler beim Laden der Budgets" });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { category, monthlyLimit } = req.body;

  if (!category || !monthlyLimit) {
    return res.status(400).json({ error: "Kategorie und Betrag sind erforderlich" });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Ensure sheet exists
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        ranges: ["FinanzBudgets!A1"],
      });
    } catch {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "FinanzBudgets",
              }
            }
          }]
        }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzBudgets!A1:D1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Kategorie", "MonatsLimit", "Erstellt", "ID"]],
        },
      });
    }

    const budgetId = `b_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "FinanzBudgets!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[category, monthlyLimit, new Date().toLocaleDateString('de-DE'), budgetId]],
      },
    });

    res.status(200).json({ success: true, id: budgetId });
  } catch (error) {
    console.error("Error creating budget:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Budgets" });
  }
}