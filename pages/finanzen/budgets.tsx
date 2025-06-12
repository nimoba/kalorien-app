'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FinanceFloatingTabBar from "../../components/finance/FinanceFloatingTabBar";

interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  currentSpent: number;
  percentage: number;
}

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  percentage: number;
  daysRemaining: number;
}

const CATEGORIES = [
  { id: 'wohnen', name: 'Wohnen', emoji: '🏠' },
  { id: 'lebensmittel', name: 'Lebensmittel', emoji: '🛒' },
  { id: 'transport', name: 'Transport', emoji: '🚗' },
  { id: 'unterhaltung', name: 'Unterhaltung', emoji: '🎬' },
  { id: 'gesundheit', name: 'Gesundheit', emoji: '🏥' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { id: 'sonstiges', name: 'Sonstiges', emoji: '📝' },
];

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);

  // Budget form state
  const [budgetCategory, setBudgetCategory] = useState('lebensmittel');
  const [budgetAmount, setBudgetAmount] = useState('');

  // Goal form state
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');
  const [goalCategory, setGoalCategory] = useState('sonstiges');

  const loadData = async () => {
    try {
      const [budgetsRes, goalsRes] = await Promise.all([
        fetch('/api/finance/budgets'),
        fetch('/api/finance/goals')
      ]);

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        setBudgets(budgetsData);
      }

      if (goalsRes.ok) {
        const goalsData = await goalsRes.json();
        setSavingsGoals(goalsData);
      }
    } catch (error) {
      console.error('Error loading budgets and goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!budgetAmount.trim()) {
      alert("Bitte geben Sie einen Betrag ein.");
      return;
    }

    const amount = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein.");
      return;
    }

    try {
      const endpoint = editBudget 
        ? `/api/finance/budgets/${editBudget.id}`
        : '/api/finance/budgets';
      
      const method = editBudget ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: budgetCategory,
          monthlyLimit: amount,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      loadData();
      closeBudgetForm();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Fehler beim Speichern des Budgets');
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!goalName.trim() || !goalTarget.trim()) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const target = parseFloat(goalTarget.replace(',', '.'));
    const current = parseFloat(goalCurrent.replace(',', '.')) || 0;
    
    if (isNaN(target) || target <= 0) {
      alert("Bitte geben Sie einen gültigen Zielbetrag ein.");
      return;
    }

    try {
      const endpoint = editGoal 
        ? `/api/finance/goals/${editGoal.id}`
        : '/api/finance/goals';
      
      const method = editGoal ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: goalName.trim(),
          targetAmount: target,
          currentAmount: current,
          deadline: goalDeadline,
          category: goalCategory,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      loadData();
      closeGoalForm();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Fehler beim Speichern des Sparziels');
    }
  };

  const closeBudgetForm = () => {
    setShowBudgetForm(false);
    setEditBudget(null);
    setBudgetCategory('lebensmittel');
    setBudgetAmount('');
  };

  const closeGoalForm = () => {
    setShowGoalForm(false);
    setEditGoal(null);
    setGoalName('');
    setGoalTarget('');
    setGoalCurrent('');
    setGoalDeadline('');
    setGoalCategory('sonstiges');
  };

  const handleEditBudget = (budget: Budget) => {
    setEditBudget(budget);
    setBudgetCategory(budget.category);
    setBudgetAmount(budget.monthlyLimit.toString());
    setShowBudgetForm(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(goal.targetAmount.toString());
    setGoalCurrent(goal.currentAmount.toString());
    setGoalDeadline(goal.deadline);
    setGoalCategory(goal.category);
    setShowGoalForm(true);
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm('Möchten Sie dieses Budget wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/budgets/${budgetId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Fehler beim Löschen des Budgets');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen des Budgets');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Möchten Sie dieses Sparziel wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Fehler beim Löschen des Sparziels');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen des Sparziels');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || { emoji: '📝', name: categoryId };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage <= 50) return '#4caf50';
    if (percentage <= 80) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: "#2c2c2c", 
        minHeight: "100vh", 
        color: "#fff", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center" 
      }}>
        <p>⏳ Lade Budgets und Sparziele...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "sans-serif",
        position: "relative",
        backgroundColor: "#2c2c2c",
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
            background: "#36a2eb",
            border: "none",
            borderRadius: "12px",
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

      <h1 style={{ margin: "0 0 24px 0" }}>🎯 Budgets & Sparziele</h1>

      {/* Tab Navigation */}
      <div style={{ 
        display: "flex", 
        marginBottom: "24px",
        background: "#1e1e1e",
        borderRadius: "12px",
        padding: "4px",
        border: "1px solid #333"
      }}>
        <button
          onClick={() => setActiveTab('budgets')}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: activeTab === 'budgets' ? "#36a2eb" : "transparent",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: activeTab === 'budgets' ? "bold" : "normal",
          }}
        >
          💰 Budgets
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          style={{
            flex: 1,
            padding: "12px",
            border: "none",
            borderRadius: "8px",
            backgroundColor: activeTab === 'goals' ? "#36a2eb" : "transparent",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: activeTab === 'goals' ? "bold" : "normal",
          }}
        >
          🎯 Sparziele
        </button>
      </div>

      {/* Add Button */}
      <div style={{ marginBottom: "24px", textAlign: "right" }}>
        <button
          onClick={() => activeTab === 'budgets' ? setShowBudgetForm(true) : setShowGoalForm(true)}
          style={{
            background: "#4caf50",
            border: "none",
            borderRadius: "12px",
            color: "#fff",
            padding: "12px 16px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + {activeTab === 'budgets' ? 'Neues Budget' : 'Neues Sparziel'}
        </button>
      </div>

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div>
          {budgets.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px", 
              color: "#888" 
            }}>
              <p style={{ fontSize: "18px", margin: "0 0 8px 0" }}>💰</p>
              <p style={{ margin: 0 }}>Noch keine Budgets vorhanden</p>
            </div>
          ) : (
            <div>
              {budgets.map((budget) => {
                const categoryInfo = getCategoryInfo(budget.category);
                const progressColor = getProgressColor(budget.percentage);
                return (
                  <motion.div
                    key={budget.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "#1e1e1e",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "16px",
                      border: budget.percentage > 100 ? "1px solid #f44336" : "1px solid #333",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "20px" }}>{categoryInfo.emoji}</span>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                            {categoryInfo.name}
                          </h3>
                          {budget.percentage > 100 && (
                            <span style={{
                              background: "#f44336",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}>
                              ÜBERSCHRITTEN
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: "14px", color: "#888" }}>
                          {budget.currentSpent.toFixed(2)} € von {budget.monthlyLimit.toFixed(2)} €
                        </p>
                      </div>
                      
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditBudget(budget)}
                          style={{
                            background: "#36a2eb",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteBudget(budget.id)}
                          style={{
                            background: "#f44336",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      background: "#333",
                      borderRadius: "8px",
                      height: "8px",
                      overflow: "hidden",
                      marginBottom: "8px"
                    }}>
                      <div style={{
                        background: progressColor,
                        height: "100%",
                        width: `${Math.min(budget.percentage, 100)}%`,
                        borderRadius: "8px",
                        transition: "width 0.3s ease"
                      }} />
                    </div>

                    <p style={{ 
                      margin: 0, 
                      fontSize: "14px", 
                      textAlign: "right",
                      color: progressColor,
                      fontWeight: "bold"
                    }}>
                      {budget.percentage.toFixed(1)}%
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Savings Goals Tab */}
      {activeTab === 'goals' && (
        <div>
          {savingsGoals.length === 0 ? (
            <div style={{ 
              textAlign: "center", 
              padding: "40px", 
              color: "#888" 
            }}>
              <p style={{ fontSize: "18px", margin: "0 0 8px 0" }}>🎯</p>
              <p style={{ margin: 0 }}>Noch keine Sparziele vorhanden</p>
            </div>
          ) : (
            <div>
              {savingsGoals.map((goal) => {
                const categoryInfo = getCategoryInfo(goal.category);
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: "#1e1e1e",
                      borderRadius: "12px",
                      padding: "20px",
                      marginBottom: "16px",
                      border: "1px solid #333",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ fontSize: "20px" }}>{categoryInfo.emoji}</span>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
                            {goal.name}
                          </h3>
                          {goal.percentage >= 100 && (
                            <span style={{
                              background: "#4caf50",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "bold"
                            }}>
                              ERREICHT
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#888" }}>
                          {goal.currentAmount.toFixed(2)} € von {goal.targetAmount.toFixed(2)} €
                        </p>
                        {goal.deadline && (
                          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                            Deadline: {goal.deadline} {goal.daysRemaining > 0 && `(${goal.daysRemaining} Tage)`}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditGoal(goal)}
                          style={{
                            background: "#36a2eb",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          style={{
                            background: "#f44336",
                            border: "none",
                            borderRadius: "6px",
                            color: "#fff",
                            padding: "6px 8px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      background: "#333",
                      borderRadius: "8px",
                      height: "8px",
                      overflow: "hidden",
                      marginBottom: "8px"
                    }}>
                      <div style={{
                        background: goal.percentage >= 100 ? "#4caf50" : "#36a2eb",
                        height: "100%",
                        width: `${Math.min(goal.percentage, 100)}%`,
                        borderRadius: "8px",
                        transition: "width 0.3s ease"
                      }} />
                    </div>

                    <p style={{ 
                      margin: 0, 
                      fontSize: "14px", 
                      textAlign: "right",
                      color: goal.percentage >= 100 ? "#4caf50" : "#36a2eb",
                      fontWeight: "bold"
                    }}>
                      {goal.percentage.toFixed(1)}%
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Budget Form Modal */}
      {showBudgetForm && (
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
            padding: "20px",
          }}
          onClick={(e) => e.target === e.currentTarget && closeBudgetForm()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              backgroundColor: "#2c2c2c",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: "24px" 
            }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "20px" }}>
                {editBudget ? '✏️ Budget bearbeiten' : '💰 Neues Budget'}
              </h2>
              <button
                onClick={closeBudgetForm}
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

            <form onSubmit={handleBudgetSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  color: "#fff", 
                  fontSize: "14px", 
                  fontWeight: "bold" 
                }}>
                  Kategorie
                </label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
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
                  {CATEGORIES.filter(cat => cat.id !== 'gehalt').map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  color: "#fff", 
                  fontSize: "14px", 
                  fontWeight: "bold" 
                }}>
                  Monatliches Budget (€) *
                </label>
                <input
                  type="text"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
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
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={closeBudgetForm}
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
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#36a2eb",
                    color: "#fff",
                    fontSize: "16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {editBudget ? "✅ Aktualisieren" : "💾 Speichern"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Goal Form Modal */}
      {showGoalForm && (
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
            padding: "20px",
          }}
          onClick={(e) => e.target === e.currentTarget && closeGoalForm()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
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
              <h2 style={{ margin: 0, color: "#fff", fontSize: "20px" }}>
                {editGoal ? '✏️ Sparziel bearbeiten' : '🎯 Neues Sparziel'}
              </h2>
              <button
                onClick={closeGoalForm}
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

            <form onSubmit={handleGoalSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  color: "#fff", 
                  fontSize: "14px", 
                  fontWeight: "bold" 
                }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="z.B. Urlaub 2025"
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
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#fff", 
                    fontSize: "14px", 
                    fontWeight: "bold" 
                  }}>
                    Zielbetrag (€) *
                  </label>
                  <input
                    type="text"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
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
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#fff", 
                    fontSize: "14px", 
                    fontWeight: "bold" 
                  }}>
                    Aktueller Betrag (€)
                  </label>
                  <input
                    type="text"
                    value={goalCurrent}
                    onChange={(e) => setGoalCurrent(e.target.value)}
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
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#fff", 
                    fontSize: "14px", 
                    fontWeight: "bold" 
                  }}>
                    Deadline (optional)
                  </label>
                  <input
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
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
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#fff", 
                    fontSize: "14px", 
                    fontWeight: "bold" 
                  }}>
                    Kategorie
                  </label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value)}
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
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={closeGoalForm}
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
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#36a2eb",
                    color: "#fff",
                    fontSize: "16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {editGoal ? "✅ Aktualisieren" : "💾 Speichern"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      <FinanceFloatingTabBar />
    </div>
  );
}