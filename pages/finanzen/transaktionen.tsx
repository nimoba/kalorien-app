'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FinanceFloatingTabBar from "../../components/finance/FinanceFloatingTabBar";
import TransactionForm from "../../components/finance/TransactionForm";

interface Transaction {
  id: string;
  date: string;
  time: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  notes?: string;
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'' | 'income' | 'expense'>('');

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/finance/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    loadTransactions();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Möchten Sie diese Transaktion wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/finance/transactions/${transactionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        handleRefresh();
      } else {
        alert('Fehler beim Löschen der Transaktion');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Fehler beim Löschen der Transaktion');
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || { emoji: '📝', name: categoryId };
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || transaction.category === filterCategory;
    const matchesType = !filterType || transaction.type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

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
        <p>⏳ Lade Transaktionen...</p>
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
        <h1 style={{ margin: 0 }}>💳 Transaktionen</h1>
        <button
          onClick={() => {
            setEditTransaction(null);
            setShowForm(true);
          }}
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
          + Neue Transaktion
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        background: "var(--surface)", 
        borderRadius: "16px", 
        padding: "16px", 
        marginBottom: "24px",
        border: "1px solid var(--border)"
      }}>
        <div style={{ marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Transaktionen suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              backgroundColor: "var(--bg)",
              color: "#fff",
              fontSize: "16px",
            }}
          />
        </div>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{
              flex: 1,
              minWidth: "120px",
              padding: "8px",
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              backgroundColor: "var(--bg)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as '' | 'income' | 'expense')}
            style={{
              flex: 1,
              minWidth: "120px",
              padding: "8px",
              border: "1px solid var(--border-strong)",
              borderRadius: "8px",
              backgroundColor: "var(--bg)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <option value="">Alle Typen</option>
            <option value="income">💰 Einnahmen</option>
            <option value="expense">💸 Ausgaben</option>
          </select>
        </div>
      </div>

      {/* Transactions List */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          color: "var(--text-3)" 
        }}>
          <p style={{ fontSize: "18px", margin: "0 0 8px 0" }}>💳</p>
          <p style={{ margin: 0 }}>
            {transactions.length === 0 
              ? "Noch keine Transaktionen vorhanden" 
              : "Keine Transaktionen gefunden"}
          </p>
        </div>
      ) : (
        <div>
          {Object.keys(groupedTransactions)
            .sort((a, b) => new Date(b.split('.').reverse().join('-')).getTime() - new Date(a.split('.').reverse().join('-')).getTime())
            .map((date) => (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: "24px",
              }}
            >
              <h3 style={{ 
                margin: "0 0 12px 0", 
                fontSize: "16px", 
                color: "#3b82f6",
                padding: "8px 0",
                borderBottom: "1px solid var(--border)"
              }}>
                {date}
              </h3>
              
              {groupedTransactions[date].map((transaction) => {
                const categoryInfo = getCategoryInfo(transaction.category);
                return (
                  <div
                    key={transaction.id}
                    style={{
                      background: "var(--surface)",
                      borderRadius: "16px",
                      padding: "16px",
                      marginBottom: "8px",
                      border: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "16px" }}>{categoryInfo.emoji}</span>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                          {transaction.description}
                        </h4>
                      </div>
                      <p style={{ 
                        margin: "4px 0 0 0", 
                        fontSize: "14px", 
                        color: "var(--text-3)" 
                      }}>
                        {categoryInfo.name} • {transaction.time}
                        {transaction.notes && ` • ${transaction.notes}`}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: "18px", 
                        fontWeight: "bold",
                        color: transaction.type === 'income' ? "#22c55e" : "#fb7185"
                      }}>
                        {transaction.type === 'income' ? '+' : '-'}{Math.abs(transaction.amount).toFixed(2)} €
                      </p>
                      
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(transaction)}
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
                          onClick={() => handleDelete(transaction.id)}
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
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      )}

      {/* Transaction Form */}
      {showForm && (
        <TransactionForm
          onClose={() => {
            setShowForm(false);
            setEditTransaction(null);
          }}
          onRefresh={handleRefresh}
          editTransaction={editTransaction || undefined}
        />
      )}

      <FinanceFloatingTabBar />
    </div>
  );
}