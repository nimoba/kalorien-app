import type { NextApiRequest, NextApiResponse } from "next";
import { chat, MODEL_FAST } from "../../../lib/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { categoryExpenses, monthlyTrends, savingsRate, expenseGrowth, topExpenses }: {
    categoryExpenses: Record<string, number>;
    monthlyTrends: Array<{ month: string; income: number; expenses: number }>;
    savingsRate: number;
    expenseGrowth: number;
    topExpenses: Array<{ description: string; amount: number; date: string }>;
  } = req.body;

  try {
    const analysis = (await chat({
      model: MODEL_FAST,
      maxTokens: 600,
      temperature: 0.7,
      messages: [
          {
            role: "system",
            content: "Du bist ein Finanzberater, der personalisierte Finanzanalysen erstellt. Antworte auf Deutsch und gib konkrete, umsetzbare Tipps."
          },
          {
            role: "user",
            content: `Analysiere bitte meine Finanzdaten und gib mir Tipps zur Verbesserung:

Ausgaben nach Kategorien:
${Object.entries(categoryExpenses).map(([cat, amount]) => `- ${cat}: ${amount.toFixed(2)}€`).join('\n')}

Monatliche Entwicklung (letzte Monate):
${monthlyTrends.slice(-3).map(m => `- ${m.month}: Einnahmen ${m.income.toFixed(2)}€, Ausgaben ${m.expenses.toFixed(2)}€`).join('\n')}

Sparquote: ${savingsRate.toFixed(1)}%
Ausgabenwachstum: ${expenseGrowth.toFixed(1)}%

Größte Ausgaben:
${topExpenses.slice(0, 5).map(e => `- ${e.description}: ${e.amount.toFixed(2)}€`).join('\n')}

Bitte analysiere diese Daten und gib mir konkrete Empfehlungen zur Optimierung meiner Finanzen. Halte die Antwort prägnant (max. 200 Wörter).`
          }
        ],
    })) || "Analyse konnte nicht generiert werden.";


    res.status(200).json({ analysis });
  } catch (error) {
    console.error("Error generating GPT analysis:", error);
    
    // Fallback analysis if OpenAI fails
    const fallbackAnalysis = generateFallbackAnalysis(categoryExpenses, savingsRate, expenseGrowth);
    res.status(200).json({ analysis: fallbackAnalysis });
  }
}

function generateFallbackAnalysis(categoryExpenses: Record<string, number>, savingsRate: number, expenseGrowth: number): string {
  let analysis = "📊 FINANZANALYSE\n\n";

  // Analyze savings rate
  if (savingsRate > 20) {
    analysis += "✅ Hervorragende Sparquote! Sie sparen überdurchschnittlich viel.\n\n";
  } else if (savingsRate > 10) {
    analysis += "👍 Gute Sparquote, aber noch Verbesserungspotential.\n\n";
  } else if (savingsRate > 0) {
    analysis += "⚠️ Niedrige Sparquote. Versuchen Sie, Ausgaben zu reduzieren.\n\n";
  } else {
    analysis += "🚨 Sie geben mehr aus als Sie einnehmen! Sofortige Maßnahmen erforderlich.\n\n";
  }

  // Analyze expense growth
  if (expenseGrowth > 10) {
    analysis += "📈 Ihre Ausgaben steigen stark. Prüfen Sie wiederkehrende Kosten.\n\n";
  } else if (expenseGrowth > 0) {
    analysis += "📊 Ausgaben steigen leicht. Behalten Sie die Entwicklung im Auge.\n\n";
  } else {
    analysis += "📉 Gute Ausgabenkontrolle! Ausgaben sind stabil oder rückläufig.\n\n";
  }

  // Analyze top categories
  const sortedCategories = Object.entries(categoryExpenses)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 2);

  if (sortedCategories.length > 0) {
    analysis += `💡 EMPFEHLUNGEN:\n`;
    analysis += `- Größter Ausgabenbereich: ${sortedCategories[0][0]} (${(sortedCategories[0][1] as number).toFixed(0)}€)\n`;
    analysis += `- Prüfen Sie Einsparpotentiale in diesem Bereich\n`;
    analysis += `- Setzen Sie sich monatliche Budgetgrenzen\n`;
    analysis += `- Nutzen Sie Apps zum Ausgaben-Tracking`;
  }

  return analysis;
}