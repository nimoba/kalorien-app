import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";

interface DayData {
  datum: string;
  foodLogged: boolean;
  weightLogged: boolean;
  completed: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    console.log('🔄 Starting historical habit data backfill...');

    // Get all food entries from Tabelle1
    let foodDates: string[] = [];
    try {
      const foodRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId!,
        range: "Tabelle1!A:A",
      });
      foodDates = (foodRes.data.values || [])
        .flat()
        .filter(date => date && date !== 'Datum') // Remove header
        .map(date => date.toString());
    } catch {
      console.log('📋 No food data found or error accessing Tabelle1');
    }

    // Get all weight entries from Gewicht
    let weightDates: string[] = [];
    try {
      const weightRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId!,
        range: "Gewicht!A:A",
      });
      weightDates = (weightRes.data.values || [])
        .flat()
        .filter(date => date && date !== 'Datum') // Remove header
        .map(date => date.toString());
    } catch {
      console.log('⚖️ No weight data found or error accessing Gewicht');
    }

    console.log(`📊 Found ${foodDates.length} food entries and ${weightDates.length} weight entries`);

    // Get unique dates and combine activities
    const allDates = [...new Set([...foodDates, ...weightDates])];
    const sortedDates = allDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    console.log(`📅 Processing ${sortedDates.length} unique dates from ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);

    // Create habit entries for each date
    const habitEntries: DayData[] = sortedDates.map(date => {
      const foodLogged = foodDates.includes(date);
      const weightLogged = weightDates.includes(date);
      const completed = foodLogged || weightLogged;

      return {
        datum: date,
        foodLogged,
        weightLogged,
        completed
      };
    });

    // Calculate streaks for each day
    const habitEntriesWithStreaks = habitEntries.map((entry, index) => {
      let streak = 0;
      if (entry.completed) {
        streak = 1;
        // Count backwards to find streak
        for (let i = index - 1; i >= 0; i--) {
          const prevEntry = habitEntries[i];
          const daysDiff = Math.floor((new Date(entry.datum).getTime() - new Date(prevEntry.datum).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === streak && prevEntry.completed) {
            streak++;
          } else {
            break;
          }
        }
      }

      return {
        ...entry,
        streak
      };
    });

    // Prepare data for Google Sheets
    const sheetData = habitEntriesWithStreaks.map(entry => [
      entry.datum,
      entry.foodLogged,
      entry.weightLogged,
      entry.streak,
      '', // No achievements stored per day
      entry.completed
    ]);

    // Create or clear Habits sheet
    await ensureHabitsSheet(sheets, sheetId!);

    // Add headers and data
    const allData = [
      ['Datum', 'Essen_Geloggt', 'Gewicht_Geloggt', 'Streak', 'Achievements', 'Completed'],
      ...sheetData
    ];

    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId!,
      range: "Habits!A:F",
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId!,
      range: "Habits!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: allData
      }
    });

    console.log(`✅ Successfully backfilled ${habitEntriesWithStreaks.length} habit entries`);

    // Calculate final stats
    const maxStreak = Math.max(...habitEntriesWithStreaks.map(e => e.streak));
    const totalDays = habitEntriesWithStreaks.filter(e => e.completed).length;
    const foodDaysCount = habitEntriesWithStreaks.filter(e => e.foodLogged).length;
    const weightDaysCount = habitEntriesWithStreaks.filter(e => e.weightLogged).length;

    res.status(200).json({
      success: true,
      message: `Backfilled ${habitEntriesWithStreaks.length} habit entries`,
      stats: {
        totalEntries: habitEntriesWithStreaks.length,
        activeDays: totalDays,
        maxStreak,
        foodDays: foodDaysCount,
        weightDays: weightDaysCount
      }
    });

  } catch (error) {
    console.error("❌ Fehler beim Backfill der Habit-Daten:", error);
    res.status(500).json({ error: "Fehler beim Backfill der Habit-Daten" });
  }
}

async function ensureHabitsSheet(sheets: ReturnType<typeof google.sheets>, sheetId: string) {
  try {
    // Try to get the sheet first
    await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Habits!A1",
    });
  } catch {
    // Create sheet if it doesn't exist
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: "Habits"
              }
            }
          }]
        }
      });
      console.log('📊 Created new Habits sheet');
    } catch (error) {
      console.log('Habits sheet might already exist:', error);
    }
  }
}

