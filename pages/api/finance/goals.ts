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

    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzZiele!A2:G",
      });
    } catch {
      return res.status(200).json([]);
    }

    const rows = response.data.values || [];
    
    const goals = rows.map((row, index) => {
      const name = row[0] || '';
      const targetAmount = parseFloat(row[1]?.toString() || '0');
      const currentAmount = parseFloat(row[2]?.toString() || '0');
      const deadline = row[3] || '';
      const category = row[4] || '';
      const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      
      let daysRemaining = 0;
      if (deadline) {
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const diffTime = deadlineDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: row[6] || `g_${index}`,
        name,
        targetAmount,
        currentAmount,
        deadline: deadline ? new Date(deadline).toLocaleDateString('de-DE') : '',
        category,
        percentage,
        daysRemaining,
      };
    });

    res.status(200).json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ error: "Fehler beim Laden der Sparziele" });
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse) {
  const { name, targetAmount, currentAmount, deadline, category } = req.body;

  if (!name || !targetAmount) {
    return res.status(400).json({ error: "Name und Zielbetrag sind erforderlich" });
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
        ranges: ["FinanzZiele!A1"],
      });
    } catch {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "FinanzZiele",
              }
            }
          }]
        }
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "FinanzZiele!A1:G1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Name", "Zielbetrag", "Aktuell", "Deadline", "Kategorie", "Erstellt", "ID"]],
        },
      });
    }

    const goalId = `g_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "FinanzZiele!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, targetAmount, currentAmount || 0, deadline || '', category, new Date().toLocaleDateString('de-DE'), goalId]],
      },
    });

    res.status(200).json({ success: true, id: goalId });
  } catch (error) {
    console.error("Error creating goal:", error);
    res.status(500).json({ error: "Fehler beim Erstellen des Sparziels" });
  }
}