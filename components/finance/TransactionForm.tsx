'use client';

import { useState } from "react";
import { motion } from "framer-motion";

interface Props {
  onClose: () => void;
  onRefresh: () => void;
  editTransaction?: {
    id: string;
    description: string;
    amount: number;
    category: string;
    type: 'income' | 'expense';
    notes?: string;
  };
}

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

export default function TransactionForm({ onClose, onRefresh, editTransaction }: Props) {
  const [description, setDescription] = useState(editTransaction?.description || '');
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || '');
  const [category, setCategory] = useState(editTransaction?.category || 'sonstiges');
  const [type, setType] = useState<'income' | 'expense'>(editTransaction?.type || 'expense');
  const [notes, setNotes] = useState(editTransaction?.notes || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim() || !amount.trim()) {
      alert("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Bitte geben Sie einen gültigen Betrag ein.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = editTransaction 
        ? `/api/finance/transactions/${editTransaction.id}`
        : '/api/finance/transactions';
      
      const method = editTransaction ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: description.trim(),
          amount: type === 'expense' ? -Math.abs(numAmount) : Math.abs(numAmount),
          category,
          type,
          notes: notes.trim(),
          date,
          time,
        }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Speichern');
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Fehler beim Speichern der Transaktion');
    } finally {
      setLoading(false);
    }
  };

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
            {editTransaction ? '✏️ Transaktion bearbeiten' : '💳 Neue Transaktion'}
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
          {/* Type Toggle */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}>
              Typ
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setType('expense')}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: type === 'expense' ? "#f44336" : "#444",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                💸 Ausgabe
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: type === 'income' ? "#4caf50" : "#444",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                💰 Einnahme
              </button>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}>
              Beschreibung *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Einkauf Supermarkt"
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

          {/* Amount */}
          <div style={{ marginBottom: "20px" }}>
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
                border: "1px solid #555",
                borderRadius: "8px",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                fontSize: "16px",
              }}
              required
            />
          </div>

          {/* Category */}
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

          {/* Date and Time */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                color: "#fff", 
                fontSize: "14px", 
                fontWeight: "bold" 
              }}>
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                Uhrzeit
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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

          {/* Notes */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              color: "#fff", 
              fontSize: "14px", 
              fontWeight: "bold" 
            }}>
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Informationen..."
              rows={3}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #555",
                borderRadius: "8px",
                backgroundColor: "#1e1e1e",
                color: "#fff",
                fontSize: "16px",
                resize: "vertical",
              }}
            />
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
              {loading ? "💾 Speichern..." : (editTransaction ? "✅ Aktualisieren" : "💾 Speichern")}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}