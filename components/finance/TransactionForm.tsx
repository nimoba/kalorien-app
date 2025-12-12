'use client';

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  { id: 'wohnen', name: 'Wohnen', icon: '🏠', color: '#6366f1' },
  { id: 'lebensmittel', name: 'Lebensmittel', icon: '🛒', color: '#10b981' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#f97316' },
  { id: 'unterhaltung', name: 'Unterhaltung', icon: '🎬', color: '#ec4899' },
  { id: 'gesundheit', name: 'Gesundheit', icon: '🏥', color: '#ef4444' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#8b5cf6' },
  { id: 'gehalt', name: 'Gehalt/Lohn', icon: '💰', color: '#22c55e' },
  { id: 'sonstiges', name: 'Sonstiges', icon: '📝', color: '#71717a' },
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
      alert("Bitte alle Pflichtfelder ausfüllen");
      return;
    }

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      alert("Bitte gültigen Betrag eingeben");
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
        headers: { 'Content-Type': 'application/json' },
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

      if (!response.ok) throw new Error('Fehler beim Speichern');

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Fehler beim Speichern');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.id === category);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={overlayStyle}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={modalStyle}
        >
          {/* Header */}
          <div style={headerStyle}>
            <div style={{
              ...headerIconStyle,
              background: type === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={type === 'expense' ? '#ef4444' : '#22c55e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <h2 style={titleStyle}>
                {editTransaction ? 'Transaktion bearbeiten' : 'Neue Transaktion'}
              </h2>
              <p style={subtitleStyle}>Einnahme oder Ausgabe erfassen</p>
            </div>
            <button onClick={onClose} style={closeButtonStyle}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={formContainerStyle}>
            {/* Type Toggle */}
            <div style={typeToggleContainerStyle}>
              <button
                type="button"
                onClick={() => setType('expense')}
                style={{
                  ...typeButtonStyle,
                  background: type === 'expense'
                    ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: type === 'expense' ? '#fff' : '#71717a',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                Ausgabe
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                style={{
                  ...typeButtonStyle,
                  background: type === 'income'
                    ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: type === 'income' ? '#fff' : '#71717a',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                Einnahme
              </button>
            </div>

            {/* Description */}
            <div style={fieldStyle}>
              <div style={{ ...fieldIconStyle, background: 'rgba(139, 92, 246, 0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div style={fieldContentStyle}>
                <label style={labelStyle}>Beschreibung *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="z.B. Einkauf Supermarkt"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            {/* Amount */}
            <div style={fieldStyle}>
              <div style={{
                ...fieldIconStyle,
                background: type === 'expense' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={type === 'expense' ? '#ef4444' : '#22c55e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div style={fieldContentStyle}>
                <label style={labelStyle}>Betrag *</label>
                <div style={amountInputContainerStyle}>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    style={{ ...inputStyle, fontSize: 20, fontWeight: 700 }}
                    required
                  />
                  <span style={{
                    ...unitStyle,
                    color: type === 'expense' ? '#ef4444' : '#22c55e'
                  }}>€</span>
                </div>
              </div>
            </div>

            {/* Category */}
            <div style={fieldStyle}>
              <div style={{
                ...fieldIconStyle,
                background: `${selectedCategory?.color || '#71717a'}15`
              }}>
                <span style={{ fontSize: 16 }}>{selectedCategory?.icon || '📝'}</span>
              </div>
              <div style={fieldContentStyle}>
                <label style={labelStyle}>Kategorie</label>
                <div style={selectWrapperStyle}>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={selectStyle}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                  <svg style={selectIconStyle} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div style={dateTimeRowStyle}>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <div style={{ ...fieldIconStyle, background: 'rgba(99, 102, 241, 0.15)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div style={fieldContentStyle}>
                  <label style={labelStyle}>Datum</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ ...fieldStyle, flex: 1 }}>
                <div style={{ ...fieldIconStyle, background: 'rgba(99, 102, 241, 0.15)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div style={fieldContentStyle}>
                  <label style={labelStyle}>Uhrzeit</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ ...fieldStyle, alignItems: 'flex-start' }}>
              <div style={{ ...fieldIconStyle, background: 'rgba(113, 113, 122, 0.15)', marginTop: 4 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="17" y1="10" x2="3" y2="10" />
                  <line x1="21" y1="6" x2="3" y2="6" />
                  <line x1="21" y1="14" x2="3" y2="14" />
                  <line x1="17" y1="18" x2="3" y2="18" />
                </svg>
              </div>
              <div style={fieldContentStyle}>
                <label style={labelStyle}>Notizen (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Informationen..."
                  rows={2}
                  style={textareaStyle}
                />
              </div>
            </div>

            {/* Buttons */}
            <div style={buttonRowStyle}>
              <button type="button" onClick={onClose} style={cancelButtonStyle}>
                Abbrechen
              </button>
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  ...saveButtonStyle,
                  background: type === 'expense'
                    ? 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                    : 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)',
                  boxShadow: type === 'expense'
                    ? '0 4px 14px rgba(239, 68, 68, 0.3)'
                    : '0 4px 14px rgba(34, 197, 94, 0.3)',
                }}
              >
                {loading ? (
                  <>
                    <div style={spinnerStyle} />
                    <span>Speichere...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{editTransaction ? 'Aktualisieren' : 'Speichern'}</span>
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AnimatePresence>
  );
}

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: 20,
};

const modalStyle: React.CSSProperties = {
  background: '#1c1c26',
  borderRadius: 24,
  width: '100%',
  maxWidth: 480,
  maxHeight: '90vh',
  overflowY: 'auto',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: '20px 20px 16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  position: 'sticky',
  top: 0,
  background: '#1c1c26',
  zIndex: 1,
};

const headerIconStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 600,
  color: '#fff',
  letterSpacing: '-0.02em',
};

const subtitleStyle: React.CSSProperties = {
  margin: '2px 0 0 0',
  fontSize: 13,
  color: '#71717a',
};

const closeButtonStyle: React.CSSProperties = {
  marginLeft: 'auto',
  width: 36,
  height: 36,
  borderRadius: 10,
  border: 'none',
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#71717a',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const formContainerStyle: React.CSSProperties = {
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const typeToggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: 4,
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 14,
  marginBottom: 8,
};

const typeButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 16px',
  borderRadius: 10,
  border: 'none',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'all 0.2s ease',
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  padding: 14,
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const fieldIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const fieldContentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: '#71717a',
  marginBottom: 4,
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  fontSize: 16,
  fontWeight: 500,
  border: 'none',
  background: 'transparent',
  color: '#fff',
  outline: 'none',
};

const amountInputContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const unitStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
};

const selectWrapperStyle: React.CSSProperties = {
  position: 'relative',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 28px 8px 0',
  fontSize: 16,
  fontWeight: 500,
  border: 'none',
  background: 'transparent',
  color: '#fff',
  outline: 'none',
  appearance: 'none',
  cursor: 'pointer',
};

const selectIconStyle: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const dateTimeRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 0',
  fontSize: 15,
  border: 'none',
  background: 'transparent',
  color: '#fff',
  outline: 'none',
  resize: 'vertical',
  minHeight: 60,
};

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  marginTop: 8,
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px 20px',
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 14,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'transparent',
  color: '#71717a',
  cursor: 'pointer',
};

const saveButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px 20px',
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 14,
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

const spinnerStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTopColor: '#fff',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};
