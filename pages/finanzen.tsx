'use client';

import { useState, useEffect } from "react";
import FinanceFloatingActionMenu from "../components/finance/FinanceFloatingActionMenu";
import FinanceFloatingTabBar from "../components/finance/FinanceFloatingTabBar";
import TransactionForm from "../components/finance/TransactionForm";
import FinanceSettings from "../components/finance/FinanceSettings";
import { motion } from "framer-motion";

interface FinanceOverview {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  todayExpenses: number;
  weekExpenses: number;
  monthExpenses: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    date: string;
    time: string;
  }>;
}

export default function FinanceDashboard() {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch("/api/finance/overview")
      .then((res) => res.json())
      .then((data) => {
        // Ensure all numeric values are valid numbers
        const safeData = {
          currentBalance: Number(data.currentBalance) || 0,
          monthlyIncome: Number(data.monthlyIncome) || 0,
          monthlyExpenses: Number(data.monthlyExpenses) || 0,
          todayExpenses: Number(data.todayExpenses) || 0,
          weekExpenses: Number(data.weekExpenses) || 0,
          monthExpenses: Number(data.monthExpenses) || 0,
          recentTransactions: data.recentTransactions || [],
        };
        setData(safeData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading finance data:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshAll = () => {
    loadData();
  };

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
        <p>⏳ Lade Finanzdaten...</p>
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
        <p>❌ Fehler beim Laden der Finanzdaten.</p>
      </div>
    );
  }

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
            boxShadow: "none"
          }}
        >
          ← Kalorien
        </button>
      </div>

      <h1 className="page-title" style={{ marginBottom: "20px" }}>Finanzen</h1>

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "var(--surface-2)",
          borderRadius: "16px",
          padding: "24px",
          marginBottom: "24px",
          textAlign: "center",
          boxShadow: "none"
        }}
      >
        <h2 style={{ margin: 0, fontSize: "18px", opacity: 0.9 }}>Aktueller Kontostand</h2>
        <p style={{ 
          margin: "8px 0 0 0", 
          fontSize: "36px", 
          fontWeight: "bold",
          color: data.currentBalance >= 0 ? "#fff" : "#ffcdd2"
        }}>
          {data.currentBalance.toFixed(2)} €
        </p>
      </motion.div>

      {/* Monthly Overview */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "12px", 
        marginBottom: "24px" 
      }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "var(--surface)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            border: "1px solid var(--border)"
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.7 }}>Einnahmen</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "bold", color: "#22c55e" }}>
            +{data.monthlyIncome.toFixed(2)} €
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "var(--surface)",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
            border: "1px solid var(--border)"
          }}
        >
          <p style={{ margin: 0, fontSize: "14px", opacity: 0.7 }}>Ausgaben</p>
          <p style={{ margin: "8px 0 0 0", fontSize: "24px", fontWeight: "bold", color: "#fb7185" }}>
            -{data.monthlyExpenses.toFixed(2)} €
          </p>
        </motion.div>
      </div>

      {/* Quick Stats */}
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
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>📊 Ausgaben Übersicht</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>Heute</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "bold" }}>
              {data.todayExpenses.toFixed(2)} €
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>Diese Woche</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "bold" }}>
              {data.weekExpenses.toFixed(2)} €
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: "12px", opacity: 0.7 }}>Dieser Monat</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "18px", fontWeight: "bold" }}>
              {data.monthExpenses.toFixed(2)} €
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recent Transactions */}
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
        <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>📋 Letzte Transaktionen</h3>
        {data.recentTransactions.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: "center", margin: "20px 0" }}>
            Noch keine Transaktionen vorhanden
          </p>
        ) : (
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {data.recentTransactions.slice(0, 5).map((transaction, index) => (
              <div
                key={transaction.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: index < 4 ? "1px solid var(--border)" : "none"
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold" }}>
                    {transaction.description}
                  </p>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", opacity: 0.7 }}>
                    {transaction.category} • {transaction.date} {transaction.time}
                  </p>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: "16px", 
                  fontWeight: "bold",
                  color: transaction.type === 'income' ? "#22c55e" : "#fb7185"
                }}>
                  {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Floating Action Menu */}
      <FinanceFloatingActionMenu
        onOpenTransaction={() => setShowTransactionForm(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Forms */}
      {showTransactionForm && (
        <TransactionForm
          onClose={() => setShowTransactionForm(false)}
          onRefresh={refreshAll}
        />
      )}

      {showSettings && (
        <FinanceSettings
          onClose={() => {
            setShowSettings(false);
            refreshAll();
          }}
        />
      )}

      {/* Tab Bar */}
      {!showTransactionForm && !showSettings && <FinanceFloatingTabBar />}
    </div>
  );
}