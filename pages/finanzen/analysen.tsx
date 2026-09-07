'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import FinanceFloatingTabBar from "../../components/finance/FinanceFloatingTabBar";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale);

interface AnalyticsData {
  categoryExpenses: { [key: string]: number };
  monthlyTrends: { month: string; income: number; expenses: number }[];
  dailyAverages: { weekday: string; amount: number }[];
  topExpenses: { description: string; amount: number; date: string }[];
  savingsRate: number;
  expenseGrowth: number;
}

const CATEGORY_COLORS = {
  wohnen: '#FF6384',
  lebensmittel: '#36A2EB',
  transport: '#FFCE56',
  unterhaltung: '#4BC0C0',
  gesundheit: '#9966FF',
  shopping: '#FF9F40',
  gehalt: '#4CAF50',
  sonstiges: '#C9CBCF',
};

const CATEGORIES = [
  { id: 'wohnen', name: 'Wohnen', emoji: '🏠' },
  { id: 'lebensmittel', name: 'Lebensmittel', emoji: '🛒' },
  { id: 'transport', name: 'Transport', emoji: '🚗' },
  { id: 'unterhaltung', name: 'Unterhaltung', emoji: '🎬' },
  { id: 'gesundheit', name: 'Gesundheit', emoji: '🏥' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { id: 'gehalt', name: 'Gehalt/Lohn', emoji: '💰' },
  { id: 'sonstiges', name: 'Sonstiges', emoji: '📝' },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisText, setAnalysisText] = useState('');
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/finance/analytics');
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async () => {
    if (!data) return;
    
    setLoadingAnalysis(true);
    try {
      const response = await fetch('/api/finance/gpt-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        setAnalysisText(result.analysis);
      }
    } catch (error) {
      console.error('Error generating analysis:', error);
      alert('Fehler beim Generieren der Analyse');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: "var(--bg)", 
        minHeight: "100vh", 
        color: "#fff", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <p>⏳ Lade Analysen...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ 
        backgroundColor: "var(--bg)", 
        minHeight: "100vh", 
        color: "#fff", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <p>❌ Fehler beim Laden der Analysedaten.</p>
      </div>
    );
  }

  // Prepare chart data
  const categoryLabels = Object.keys(data.categoryExpenses).map(key => {
    const category = CATEGORIES.find(c => c.id === key);
    return category ? `${category.emoji} ${category.name}` : key;
  });
  
  const categoryData = {
    labels: categoryLabels,
    datasets: [{
      data: Object.values(data.categoryExpenses),
      backgroundColor: Object.keys(data.categoryExpenses).map(key => CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS] || '#C9CBCF'),
      borderWidth: 2,
      borderColor: 'var(--bg)',
    }]
  };

  const monthlyTrendsData = {
    labels: data.monthlyTrends.map(t => t.month),
    datasets: [
      {
        label: 'Einnahmen',
        data: data.monthlyTrends.map(t => t.income),
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
      },
      {
        label: 'Ausgaben',
        data: data.monthlyTrends.map(t => t.expenses),
        backgroundColor: 'rgba(244, 67, 54, 0.6)',
        borderColor: 'rgba(244, 67, 54, 1)',
        borderWidth: 2,
      }
    ]
  };

  const dailyAveragesData = {
    labels: data.dailyAverages.map(d => d.weekday),
    datasets: [{
      label: 'Durchschnittliche Ausgaben',
      data: data.dailyAverages.map(d => d.amount),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 2,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: 'var(--surface-3)'
        }
      },
      y: {
        ticks: {
          color: '#ffffff'
        },
        grid: {
          color: 'var(--surface-3)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          },
          usePointStyle: true,
          padding: 20
        }
      }
    }
  };

  return (
    <div
      style={{
        padding: "24px",
        
        position: "relative",
        backgroundColor: "var(--bg)",
        minHeight: "100vh",
        color: "#ffffff",
        paddingBottom: "100px",
      }}
    >
      {/* App Switcher */}
      <div style={{ 
        position: "absolute", 
        top: "20px", 
        right: "20px",
        zIndex: 1000
      }}>
        <button
          onClick={() => window.location.href = "/"}
          style={{
            background: "#3b82f6",
            border: "none",
            borderRadius: "16px",
            color: "#fff",
            padding: "8px 12px",
            fontSize: "14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(54, 162, 235, 0.3)"
          }}
        >
          🍽️ Kalorien
        </button>
      </div>

      <h1 style={{ margin: "0 0 24px 0" }}>📊 Finanz-Analysen</h1>

      {/* Summary Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "16px", 
        marginBottom: "24px" 
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--surface)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            border: "1px solid var(--border)"
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-3)" }}>Sparquote</h3>
          <p style={{ 
            margin: 0, 
            fontSize: "24px", 
            fontWeight: "bold",
            color: data.savingsRate >= 0 ? "#22c55e" : "#fb7185"
          }}>
            {data.savingsRate.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "var(--surface)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            border: "1px solid var(--border)"
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-3)" }}>Ausgaben-Wachstum</h3>
          <p style={{ 
            margin: 0, 
            fontSize: "24px", 
            fontWeight: "bold",
            color: data.expenseGrowth <= 0 ? "#22c55e" : "#fb7185"
          }}>
            {data.expenseGrowth > 0 ? '+' : ''}{data.expenseGrowth.toFixed(1)}%
          </p>
        </motion.div>
      </div>

      {/* Category Expenses Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid var(--border)"
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: "18px" }}>💸 Ausgaben nach Kategorien</h3>
        <div style={{ height: "300px" }}>
          <Doughnut data={categoryData} options={doughnutOptions} />
        </div>
      </motion.div>

      {/* Monthly Trends Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid var(--border)"
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: "18px" }}>📈 Monatlicher Verlauf</h3>
        <div style={{ height: "300px" }}>
          <Bar data={monthlyTrendsData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Daily Averages Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid var(--border)"
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: "18px" }}>📅 Ausgaben nach Wochentag</h3>
        <div style={{ height: "250px" }}>
          <Bar data={dailyAveragesData} options={chartOptions} />
        </div>
      </motion.div>

      {/* Top Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid var(--border)"
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", fontSize: "18px" }}>💰 Größte Ausgaben</h3>
        {data.topExpenses.map((expense, index) => (
          <div key={index} style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 0",
            borderBottom: index < data.topExpenses.length - 1 ? "1px solid var(--border)" : "none"
          }}>
            <div>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
                {expense.description}
              </p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-3)" }}>
                {expense.date}
              </p>
            </div>
            <p style={{ 
              margin: 0, 
              fontSize: "16px", 
              fontWeight: "bold",
              color: "#fb7185"
            }}>
              -{expense.amount.toFixed(2)} €
            </p>
          </div>
        ))}
      </motion.div>

      {/* AI Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid var(--border)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "18px" }}>🤖 KI-Finanzanalyse</h3>
          <button
            onClick={generateAnalysis}
            disabled={loadingAnalysis}
            style={{
              background: loadingAnalysis ? "var(--surface-3)" : "#3b82f6",
              border: "none",
              borderRadius: "8px",
              color: "#fff",
              padding: "8px 12px",
              fontSize: "14px",
              cursor: loadingAnalysis ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {loadingAnalysis ? "🤖 Analysiere..." : "🤖 Analyse generieren"}
          </button>
        </div>
        
        {analysisText ? (
          <div style={{
            background: "var(--bg)",
            borderRadius: "8px",
            padding: "16px",
            border: "1px solid var(--border)",
            lineHeight: "1.6"
          }}>
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{analysisText}</p>
          </div>
        ) : (
          <p style={{ margin: 0, color: "var(--text-3)", fontStyle: "italic" }}>
            Klicken Sie auf &quot;Analyse generieren&quot; um eine personalisierte KI-Analyse Ihrer Finanzen zu erhalten.
          </p>
        )}
      </motion.div>

      <FinanceFloatingTabBar />
    </div>
  );
}