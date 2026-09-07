'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FinanceFloatingTabBar from "../../components/finance/FinanceFloatingTabBar";

interface RecurringPayment {
  id: string;
  name: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly' | 'weekly';
  startDate: string;
  endDate?: string;
  active: boolean;
  nextPayment: string;
  daysUntilPayment: number;
}

const CATEGORIES = [
  { id: 'wohnen', name: 'Wohnen', emoji: '🏠' },
  { id: 'transport', name: 'Transport', emoji: '🚗' },
  { id: 'unterhaltung', name: 'Unterhaltung', emoji: '🎬' },
  { id: 'gesundheit', name: 'Gesundheit', emoji: '🏥' },
  { id: 'sonstiges', name: 'Sonstiges', emoji: '📝' },
];

export default function RecurringPaymentsPage() {
  const [payments, setPayments] = useState<RecurringPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPayment, setEditPayment] = useState<RecurringPayment | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('sonstiges');
  const [frequency, setFrequency] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);

  const loadPayments = async () => {
    try {
      const response = await fetch('/api/finance/recurring');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error loading recurring payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !amount.trim()) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein.");
      return;
    }

    try {
      const endpoint = editPayment 
        ? `/api/finance/recurring/${editPayment.id}`
        : '/api/finance/recurring';
      
      const method = editPayment ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          amount: numAmount,
          category,
          frequency,
          startDate,
          endDate: endDate || null,
          active,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      loadPayments();
      closeForm();
    } catch (error) {
      console.error('Error saving recurring payment:', error);
      alert('Fehler beim Speichern der wiederkehrenden Zahlung');
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditPayment(null);
    setName('');
    setAmount('');
    setCategory('sonstiges');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setActive(true);
  };

  const handleEdit = (payment: RecurringPayment) => {
    setEditPayment(payment);
    setName(payment.name);
    setAmount(payment.amount.toString());
    setCategory(payment.category);
    setFrequency(payment.frequency);
    setStartDate(payment.startDate);
    setEndDate(payment.endDate || '');
    setActive(payment.active);
    setShowForm(true);
  };

  const handleToggleActive = async (payment: RecurringPayment) => {
    try {
      const response = await fetch(`/api/finance/recurring/${payment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...payment,
          active: !payment.active,
        }),
      });

      if (response.ok) {
        loadPayments();
      }
    } catch (error) {
      console.error('Error toggling payment:', error);
    }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Möchten Sie diese wiederkehrende Zahlung wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/recurring/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadPayments();
      } else {
        alert('Fehler beim Löschen der wiederkehrenden Zahlung');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen der wiederkehrenden Zahlung');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || { emoji: '📝', name: categoryId };
  };

  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Wöchentlich';
      case 'monthly': return 'Monatlich';
      case 'yearly': return 'Jährlich';
      default: return freq;
    }
  };

  const totalMonthlyAmount = payments
    .filter(p => p.active)
    .reduce((sum, p) => {
      if (p.frequency === 'monthly') return sum + p.amount;
      if (p.frequency === 'yearly') return sum + (p.amount / 12);
      if (p.frequency === 'weekly') return sum + (p.amount * 4.33);
      return sum;
    }, 0);

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
        <p>⏳ Lade wiederkehrende Zahlungen...</p>
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
            boxShadow: "0 2px 8px rgba(54, 162, 235, 0.3)"
          }}
        >
          🍽️ Kalorien
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ margin: 0 }}>🔄 Wiederkehrende Zahlungen</h1>
        <button
          onClick={() => setShowForm(true)}
          style={{
            background: "#22c55e",
            border: "none",
            borderRadius: "16px",
            color: "#fff",
            padding: "12px 16px",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          + Neue Zahlung
        </button>
      </div>

      {/* Monthly Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid var(--border)",
          textAlign: "center"
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>💰 Monatliche Fixkosten</h3>
        <p style={{ 
          margin: 0, 
          fontSize: "28px", 
          fontWeight: "bold",
          color: "#fb7185"
        }}>
          {totalMonthlyAmount.toFixed(2)} €
        </p>
      </motion.div>

      {/* Payments List */}
      {payments.length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "var(--text-3)" 
        }}>
          <p style={{ fontSize: "18px", margin: "0 0 8px 0" }}>🔄</p>
          <p style={{ margin: 0 }}>Noch keine wiederkehrenden Zahlungen vorhanden</p>
        </div>
      ) : (
        <div>
          {payments.map((payment) => {
            const categoryInfo = getCategoryInfo(payment.category);
            const isUpcoming = payment.daysUntilPayment <= 7 && payment.daysUntilPayment >= 0;
            return (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: payment.active ? "var(--surface)" : "#2a2a2a",
                  borderRadius: "16px",
                  padding: "16px",
                  marginBottom: "12px",
                  border: `1px solid ${isUpcoming ? "#fbbf24" : "var(--surface-2)"}`,
                  opacity: payment.active ? 1 : 0.6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span style={{ fontSize: "16px" }}>{categoryInfo.emoji}</span>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                        {payment.name}
                      </h4>
                      {!payment.active && (
                        <span style={{
                          background: "var(--surface-3)",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}>
                          INAKTIV
                        </span>
                      )}
                      {isUpcoming && payment.active && (
                        <span style={{
                          background: "#fbbf24",
                          color: "#fff",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "12px"
                        }}>
                          BALD FÄLLIG
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: "18px", 
                        fontWeight: "bold",
                        color: "#fb7185"
                      }}>
                        {payment.amount.toFixed(2)} €
                      </p>
                      <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}>
                        {getFrequencyText(payment.frequency)}
                      </p>
                      <p style={{ margin: 0, fontSize: "14px", color: "var(--text-3)" }}>
                        Nächste Zahlung: {payment.nextPayment}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => handleToggleActive(payment)}
                      style={{
                        background: payment.active ? "#fbbf24" : "#22c55e",
                        border: "none",
                        borderRadius: "6px",
                        color: "#fff",
                        padding: "6px 8px",
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      {payment.active ? "⏸️" : "▶️"}
                    </button>
                    <button
                      onClick={() => handleEdit(payment)}
                      style={{
                        background: "#3b82f6",
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
                      onClick={() => handleDelete(payment.id)}
                      style={{
                        background: "#fb7185",
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
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
              backgroundColor: "var(--bg)",
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
                {editPayment ? '✏️ Zahlung bearbeiten' : '🔄 Neue wiederkehrende Zahlung'}
              </h2>
              <button
                onClick={closeForm}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-2)",
                  fontSize: "24px",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Netflix Abo"
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "8px",
                    backgroundColor: "var(--surface)",
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
                    Betrag (€) *
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      backgroundColor: "var(--surface)",
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
                    Häufigkeit
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as 'monthly' | 'yearly' | 'weekly')}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      backgroundColor: "var(--surface)",
                      color: "#fff",
                      fontSize: "16px",
                    }}
                  >
                    <option value="weekly">Wöchentlich</option>
                    <option value="monthly">Monatlich</option>
                    <option value="yearly">Jährlich</option>
                  </select>
                </div>
              </div>

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
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid var(--border-strong)",
                    borderRadius: "8px",
                    backgroundColor: "var(--surface)",
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

              <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "8px", 
                    color: "#fff", 
                    fontSize: "14px", 
                    fontWeight: "bold" 
                  }}>
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      backgroundColor: "var(--surface)",
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
                    Enddatum (optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "8px",
                      backgroundColor: "var(--surface)",
                      color: "#fff",
                      fontSize: "16px",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center",
                  gap: "8px",
                  color: "#fff", 
                  fontSize: "14px", 
                  cursor: "pointer"
                }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    style={{
                      width: "16px",
                      height: "16px",
                    }}
                  />
                  Aktiv
                </label>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={closeForm}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "1px solid var(--border-strong)",
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
                    backgroundColor: "#3b82f6",
                    color: "#fff",
                    fontSize: "16px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  {editPayment ? "✅ Aktualisieren" : "💾 Speichern"}
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