'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
}

interface FinanceSettingsData {
  startingBalance: number;
  currency: string;
  monthlyBudget: number;
}

export default function FinanceSettings({ onClose }: Props) {
  const [startingBalance, setStartingBalance] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/finance/settings');
      if (response.ok) {
        const data: FinanceSettingsData = await response.json();
        setStartingBalance(data.startingBalance?.toString() || '0');
        setCurrency(data.currency || 'EUR');
        setMonthlyBudget(data.monthlyBudget?.toString() || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const startingBalanceNum = parseFloat(startingBalance.replace(',', '.'));
    const monthlyBudgetNum = parseFloat(monthlyBudget.replace(',', '.')) || 0;

    if (isNaN(startingBalanceNum)) {
      alert("Bitte geben Sie einen gültigen Startsaldo ein.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/finance/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startingBalance: startingBalanceNum,
          currency,
          monthlyBudget: monthlyBudgetNum,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Fehler beim Speichern der Einstellungen');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/finance/export');
      if (!response.ok) {
        throw new Error('Export fehlgeschlagen');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finanzen-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Fehler beim Exportieren der Daten');
    }
  };

  if (initialLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
        }}
      >
        <div style={{ color: "#fff", fontSize: "16px" }}>⏳ Lade Einstellungen...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        style={{
          backgroundColor: "#2c2c2c",
          borderRadius: "16px",
          padding: "24px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "24px" 
        }}>
          <h2 style={{ 
            margin: 0, 
            color: "#fff", 
            fontSize: "20px" 
          }}>
            ⚙️ Finanz-Einstellungen
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#ccc",
              fontSize: "24px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Starting Balance */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}>
              Startsaldo (€)
            </label>
            <input
              type="text"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              placeholder="0,00"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #555",
                borderRadius: "8px",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                fontSize: "16px",
              }}
              required
            />
            <p style={{ 
              margin: "4px 0 0 0", 
              fontSize: "12px", 
              color: "#888" 
            }}>
              Der Kontostand zu Beginn Ihrer Aufzeichnungen
            </p>
          </div>

          {/* Currency */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}>
              Währung
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #555",
                borderRadius: "8px",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                fontSize: "16px",
              }}
            >
              <option value="EUR">€ Euro (EUR)</option>
              <option value="USD">$ US-Dollar (USD)</option>
              <option value="CHF">₣ Schweizer Franken (CHF)</option>
            </select>
          </div>

          {/* Monthly Budget */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}>
              Monatsbudget (€, optional)
            </label>
            <input
              type="text"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="0,00"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #555",
                borderRadius: "8px",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                fontSize: "16px",
              }}
            />
            <p style={{ 
              margin: "4px 0 0 0", 
              fontSize: "12px", 
              color: "#888" 
            }}>
              Maximale Ausgaben pro Monat (für Budgetanalyse)
            </p>
          </div>

          {/* Export Button */}
          <div style={{ marginBottom: "24px" }}>
            <button
              type="button"
              onClick={handleExport}
              style={{
                width: "100%",
                padding: "14px",
                border: "1px solid #36a2eb",
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: "#36a2eb",
                fontSize: "16px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              📊 Daten exportieren (CSV)
            </button>
            <p style={{ 
              margin: "4px 0 0 0", 
              fontSize: "12px", 
              color: "#888",
              textAlign: "center"
            }}>
              Alle Transaktionen als CSV-Datei herunterladen
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                border: "1px solid #555",
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: "#fff",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: loading ? "#666" : "#36a2eb",
                color: "#fff",
                fontSize: "16px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "bold",
              }}
            >
              {loading ? "💾 Speichern..." : "💾 Speichern"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}