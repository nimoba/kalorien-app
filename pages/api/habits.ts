import type { NextApiRequest, NextApiResponse } from "next";
import { google } from "googleapis";


interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  achievements: Achievement[];
  weekData: WeekHabit[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  achievedDate?: string;
}

interface WeekHabit {
  datum: string;
  foodLogged: boolean;
  weightLogged: boolean;
  completed: boolean;
}

const ACHIEVEMENTS = [
  // Beginner achievements
  { id: 'first_day', title: 'Erster Schritt', description: 'Ersten Tag erfolgreich geloggt', icon: '🌱' },
  { id: 'food_explorer', title: 'Essen-Entdecker', description: '10 Tage Essen geloggt', icon: '🔍' },
  { id: 'scale_starter', title: 'Waagen-Starter', description: '7 Tage Gewicht geloggt', icon: '📊' },
  
  // Streak achievements
  { id: 'week_streak', title: 'Woche geschafft', description: '7 Tage in Folge geloggt', icon: '🔥' },
  { id: 'two_week_warrior', title: 'Zwei-Wochen-Held', description: '14 Tage Streak erreicht', icon: '⚡' },
  { id: 'month_streak', title: 'Monats-Champion', description: '30 Tage in Folge geloggt', icon: '👑' },
  { id: 'century_club', title: 'Jahrhundert-Club', description: '100 Tage Streak erreicht', icon: '💯' },
  { id: 'year_champion', title: 'Jahres-Champion', description: '365 Tage Streak erreicht', icon: '🏆' },
  
  // Food achievements
  { id: 'food_master', title: 'Ernährungsprofi', description: '50 Tage Essen geloggt', icon: '🍽️' },
  { id: 'nutrition_legend', title: 'Ernährungs-Legende', description: '200 Tage Essen geloggt', icon: '🥇' },
  
  // Weight achievements
  { id: 'scale_warrior', title: 'Waagen-Krieger', description: '30 Tage Gewicht geloggt', icon: '⚖️' },
  { id: 'weight_champion', title: 'Gewichts-Champion', description: '100 Tage Gewicht geloggt', icon: '🏋️' },
  
  // Perfect day achievements
  { id: 'perfect_day', title: 'Perfekter Tag', description: 'Essen und Gewicht am selben Tag', icon: '✨' },
  { id: 'perfect_week', title: 'Perfekte Woche', description: '7 Tage alles geloggt', icon: '⭐' },
  
  // Milestone achievements
  { id: 'fifty_club', title: 'Fünfzig-Club', description: '50 aktive Tage erreicht', icon: '🎯' },
  { id: 'hundred_hero', title: 'Hundert-Held', description: '100 aktive Tage erreicht', icon: '🦸' },
  { id: 'year_master', title: 'Jahres-Meister', description: '365 aktive Tage erreicht', icon: '🌟' },
  
  // Special achievements
  { id: 'comeback_kid', title: 'Comeback Kid', description: 'Nach Pause wieder angefangen', icon: '💪' },
  { id: 'consistency_king', title: 'Konstanz-König', description: 'Keine Pause länger als 2 Tage', icon: '👸' },
  { id: 'dedication_master', title: 'Hingabe-Meister', description: '90% der Tage im Monat geloggt', icon: '🎖️' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return await getHabitStats(req, res);
  } else if (req.method === 'POST') {
    return await updateHabitData(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getHabitStats(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    // Get or create Habits sheet
    let habitsData;
    try {
      const habitsRes = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId!,
        range: "Habits!A:F",
      });
      habitsData = habitsRes.data.values || [];
    } catch {
      // Create Habits sheet if it doesn't exist
      await createHabitsSheet(sheets, sheetId!);
      habitsData = [['Datum', 'Essen_Geloggt', 'Gewicht_Geloggt', 'Streak', 'Achievements', 'Completed']];
    }

    const today = new Date().toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
    
    // Check today's activity
    const todaysFood = await checkTodaysFood(sheets, sheetId!, today);
    const todaysWeight = await checkTodaysWeight(sheets, sheetId!, today);
    
    // Update today's habit data
    await updateTodaysHabit(sheets, sheetId!, today, todaysFood, todaysWeight);
    
    // Calculate stats
    const stats = calculateHabitStats(habitsData, today, todaysFood, todaysWeight);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error("❌ Fehler beim Laden der Habit-Daten:", error);
    res.status(500).json({ error: "Fehler beim Abrufen der Habit-Daten" });
  }
}

async function updateHabitData(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { foodLogged, weightLogged } = req.body;
    
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || ""),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const today = new Date().toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
    
    await updateTodaysHabit(sheets, sheetId!, today, foodLogged, weightLogged);
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Fehler beim Aktualisieren der Habit-Daten:", error);
    res.status(500).json({ error: "Fehler beim Aktualisieren der Habit-Daten" });
  }
}

async function createHabitsSheet(sheets: ReturnType<typeof google.sheets>, sheetId: string) {
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
    
    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Habits!A1:F1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [['Datum', 'Essen_Geloggt', 'Gewicht_Geloggt', 'Streak', 'Achievements', 'Completed']]
      }
    });
  } catch (error) {
    console.log("Habits sheet bereits vorhanden oder Fehler beim Erstellen:", error);
  }
}

async function checkTodaysFood(sheets: ReturnType<typeof google.sheets>, sheetId: string, today: string): Promise<boolean> {
  try {
    const foodRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Tabelle1!A:A",
    });
    
    const foodData = foodRes.data.values || [];
    return foodData.some((row: string[]) => row[0] === today);
  } catch {
    return false;
  }
}

async function checkTodaysWeight(sheets: ReturnType<typeof google.sheets>, sheetId: string, today: string): Promise<boolean> {
  try {
    const weightRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Gewicht!A:A",
    });
    
    const weightData = weightRes.data.values || [];
    return weightData.some((row: string[]) => row[0] === today);
  } catch {
    return false;
  }
}

async function updateTodaysHabit(sheets: ReturnType<typeof google.sheets>, sheetId: string, today: string, foodLogged: boolean, weightLogged: boolean) {
  try {
    const habitsRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Habits!A:F",
    });
    
    const habitsData = habitsRes.data.values || [];
    const todayRowIndex = habitsData.findIndex((row: string[]) => row[0] === today);
    
    const completed = foodLogged || weightLogged;
    const streak = calculateStreak(habitsData, today, completed);
    const achievements = checkAchievements(habitsData, streak, foodLogged, weightLogged);
    
    const rowData = [today, foodLogged, weightLogged, streak, achievements.join(','), completed];
    
    if (todayRowIndex > 0) {
      // Update existing row
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `Habits!A${todayRowIndex + 1}:F${todayRowIndex + 1}`,
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData]
        }
      });
    } else {
      // Add new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "Habits!A:F",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [rowData]
        }
      });
    }
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Habit-Daten:", error);
  }
}

function calculateStreak(habitsData: string[][], today: string, todayCompleted: boolean): number {
  if (!todayCompleted) return 0;
  
  const sortedData = habitsData
    .slice(1) // Remove header
    .filter(row => row[0]) // Remove empty rows
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
  
  let streak = 1;
  const todayDate = new Date(today);
  
  for (let i = sortedData.length - 1; i >= 0; i--) {
    const rowDate = new Date(sortedData[i][0]);
    const daysDiff = Math.floor((todayDate.getTime() - rowDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === streak && sortedData[i][5] === 'true') {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

function checkAchievements(habitsData: string[][], streak: number, foodLogged: boolean, weightLogged: boolean): string[] {
  const achievements: string[] = [];
  
  const dataRows = habitsData.slice(1).filter(row => row[0]); // Remove header and empty rows
  const foodDays = dataRows.filter(row => row[1] === 'true').length;
  const weightDays = dataRows.filter(row => row[2] === 'true').length;
  const totalActiveDays = dataRows.filter(row => row[5] === 'true').length;
  
  // Beginner achievements
  if (totalActiveDays >= 1) achievements.push('first_day');
  if (foodDays >= 10) achievements.push('food_explorer');
  if (weightDays >= 7) achievements.push('scale_starter');
  
  // Streak achievements
  if (streak >= 7) achievements.push('week_streak');
  if (streak >= 14) achievements.push('two_week_warrior');
  if (streak >= 30) achievements.push('month_streak');
  if (streak >= 100) achievements.push('century_club');
  if (streak >= 365) achievements.push('year_champion');
  
  // Food achievements
  if (foodDays >= 50) achievements.push('food_master');
  if (foodDays >= 200) achievements.push('nutrition_legend');
  
  // Weight achievements
  if (weightDays >= 30) achievements.push('scale_warrior');
  if (weightDays >= 100) achievements.push('weight_champion');
  
  // Perfect day achievements
  if (foodLogged && weightLogged) {
    achievements.push('perfect_day');
    
    // Check for perfect week (last 7 days all had both)
    const last7Days = dataRows.slice(-7);
    if (last7Days.length >= 7 && last7Days.every(row => row[1] === 'true' && row[2] === 'true')) {
      achievements.push('perfect_week');
    }
  }
  
  // Milestone achievements
  if (totalActiveDays >= 50) achievements.push('fifty_club');
  if (totalActiveDays >= 100) achievements.push('hundred_hero');
  if (totalActiveDays >= 365) achievements.push('year_master');
  
  // Special achievements
  const last30Days = dataRows.slice(-30);
  if (last30Days.length >= 30) {
    const activeDaysInMonth = last30Days.filter(row => row[5] === 'true').length;
    if (activeDaysInMonth >= 27) { // 90% of 30 days
      achievements.push('dedication_master');
    }
  }
  
  // Consistency achievement - no gaps longer than 2 days in last 30 days
  if (checkConsistency(dataRows.slice(-30))) {
    achievements.push('consistency_king');
  }
  
  return achievements;
}

function calculateHabitStats(habitsData: string[][], today: string, todaysFood: boolean, todaysWeight: boolean): HabitStats {
  const dataRows = habitsData.slice(1).filter(row => row[0]);
  
  let currentStreak = 0;
  let longestStreak = 0;
  const totalDays = dataRows.length;
  
  // Calculate current streak
  const completed = todaysFood || todaysWeight;
  if (completed) {
    currentStreak = calculateStreak(habitsData, today, completed);
  }
  
  // Calculate longest streak
  dataRows.forEach(row => {
    const streak = parseInt(row[3]) || 0;
    if (streak > longestStreak) {
      longestStreak = streak;
    }
  });
  
  // Get achievements
  const allAchievements = checkAchievements(habitsData, currentStreak, todaysFood, todaysWeight);
  const achievements: Achievement[] = ACHIEVEMENTS.map(ach => ({
    ...ach,
    achieved: allAchievements.includes(ach.id),
    achievedDate: allAchievements.includes(ach.id) ? today : undefined
  }));
  
  // Get week data (last 7 days)
  const weekData: WeekHabit[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
    
    const dayData = dataRows.find(row => row[0] === dateStr);
    weekData.push({
      datum: dateStr,
      foodLogged: dayData ? dayData[1] === 'true' : false,
      weightLogged: dayData ? dayData[2] === 'true' : false,
      completed: dayData ? dayData[5] === 'true' : false
    });
  }
  
  return {
    currentStreak,
    longestStreak,
    totalDays,
    achievements,
    weekData
  };
}

function checkConsistency(recentData: string[][]): boolean {
  if (recentData.length < 7) return false;
  
  let maxGap = 0;
  let currentGap = 0;
  
  for (const row of recentData) {
    if (row[5] === 'true') { // completed day
      if (currentGap > maxGap) {
        maxGap = currentGap;
      }
      currentGap = 0;
    } else {
      currentGap++;
    }
  }
  
  // Check final gap
  if (currentGap > maxGap) {
    maxGap = currentGap;
  }
  
  return maxGap <= 2; // No gap longer than 2 days
}