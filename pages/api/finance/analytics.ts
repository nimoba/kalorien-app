import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

interface Transaction {
  date: string;
  time: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
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
      // No transactions yet
      return res.status(200).json({
        categoryExpenses: {},
        monthlyTrends: [],
        dailyAverages: [],
        topExpenses: [],
        savingsRate: 0,
        expenseGrowth: 0,
      });
    }

    const transactionRows = transactionsResponse.data.values || [];
    
    const transactions: Transaction[] = transactionRows.map(row => ({
      date: row[0] || '',
      time: row[1] || '',
      description: row[2] || '',
      amount: parseFloat(row[3]?.toString() || '0'),
      category: row[4] || '',
      type: row[5] as 'income' | 'expense' || 'expense',
    }));

    // Calculate category expenses (only expenses)
    const categoryExpenses: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category || 'sonstiges';
        categoryExpenses[category] = (categoryExpenses[category] || 0) + Math.abs(transaction.amount);
      });

    // Calculate monthly trends (last 12 months)
    const monthlyTrends = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = monthDate.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' });
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date.split('.').reverse().join('-'));
        return transactionDate.getMonth() === monthDate.getMonth() && 
               transactionDate.getFullYear() === monthDate.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      monthlyTrends.push({ month, income, expenses });
    }

    // Calculate daily averages by weekday
    const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const weekdayTotals: { [key: number]: { total: number; count: number } } = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const date = new Date(transaction.date.split('.').reverse().join('-'));
        const weekday = date.getDay();
        
        if (!weekdayTotals[weekday]) {
          weekdayTotals[weekday] = { total: 0, count: 0 };
        }
        
        weekdayTotals[weekday].total += Math.abs(transaction.amount);
        weekdayTotals[weekday].count += 1;
      });

    const dailyAverages = weekdayNames.map((name, index) => ({
      weekday: name,
      amount: weekdayTotals[index] ? weekdayTotals[index].total / weekdayTotals[index].count : 0
    }));

    // Get top 10 expenses
    const topExpenses = transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 10)
      .map(t => ({
        description: t.description,
        amount: Math.abs(t.amount),
        date: t.date
      }));

    // Calculate savings rate (last 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const recentTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date.split('.').reverse().join('-'));
      return transactionDate >= threeMonthsAgo;
    });

    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    // Calculate expense growth (compare last 3 months vs previous 3 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const previousPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date.split('.').reverse().join('-'));
      return transactionDate >= sixMonthsAgo && transactionDate < threeMonthsAgo;
    });

    const previousExpenses = previousPeriodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const currentExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenseGrowth = previousExpenses > 0 
      ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 
      : 0;

    const analytics = {
      categoryExpenses,
      monthlyTrends,
      dailyAverages,
      topExpenses,
      savingsRate,
      expenseGrowth,
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error("Error generating analytics:", error);
    res.status(500).json({ error: "Fehler beim Generieren der Analysen" });
  }
}