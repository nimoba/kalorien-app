'use client';

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { KalorienHalbkreis } from "../components/charts/KalorienHalbkreis";
import { MakroBalken } from "../components/charts/MakroBalken";
import { TagesLineChart } from "../components/charts/TagesLineChart";
import { WochenChart } from "../components/charts/WochenChart";
import FloatingForm from "../components/FloatingForm";
import SettingsForm from "../components/SettingsForm";
import FloatingActionMenu from "../components/FloatingActionMenu";
import GewichtForm from "../components/GewichtForm";
import FloatingTabBar from "../components/FloatingTabBar";
import KcalBilanzChart from "../components/charts/KcalBilanzChart";
import SportForm from "../components/SportForm";
import DayCounter from "../components/DayCounter";

interface DashboardData {
  kalorien: number;
  ziel: number;
  kh: number;
  zielKh: number;
  eiweiss: number;
  zielEiweiss: number;
  fett: number;
  zielFett: number;
  eintraege: { zeit: string; kcal: number }[];
}

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [daten, setDaten] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWeight, setShowWeight] = useState(false);
  const [showSport, setShowSport] = useState(false);
  const [refreshBilanz, setRefreshBilanz] = useState(0);

  const loadDaten = () => {
    fetch("/api/overview")
      .then((res) => res.json())
      .then((data) => {
        setDaten(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadDaten();
  }, []);

  const refreshAll = () => {
    loadDaten();
    setRefreshBilanz((v) => v + 1);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(99, 102, 241, 0.2)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <span style={{ color: '#71717a', fontSize: 14 }}>Lade Daten...</span>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </motion.div>
      </div>
    );
  }

  if (!daten) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f0f14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ color: '#fff', margin: 0, fontSize: 16 }}>Fehler beim Laden der Daten</p>
          <button
            onClick={loadDaten}
            style={{
              marginTop: 16,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Erneut versuchen
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "20px",
        minHeight: "100vh",
        background: "#0f0f14",
        color: "#ffffff",
        paddingBottom: "120px",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          marginBottom: 24,
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Dashboard
            </h1>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 14,
              color: '#71717a',
            }}>
              {new Date().toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main Calorie Card */}
      <KalorienHalbkreis gegessen={daten.kalorien} ziel={daten.ziel} />

      {/* Macros Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ marginTop: 20 }}
      >
        <h2 style={{
          margin: '0 0 16px 0',
          fontSize: 16,
          fontWeight: 600,
          color: '#fff',
          letterSpacing: '-0.02em',
        }}>
          Makros
        </h2>
        <MakroBalken label="Kohlenhydrate" value={daten.kh} ziel={daten.zielKh} />
        <MakroBalken label="Eiweiß" value={daten.eiweiss} ziel={daten.zielEiweiss} />
        <MakroBalken label="Fett" value={daten.fett} ziel={daten.zielFett} />
      </motion.div>

      {/* Day Counter */}
      <DayCounter refresh={refreshBilanz} />

      {/* Daily Progress Chart */}
      <TagesLineChart eintraege={daten.eintraege} ziel={daten.ziel} />

      {/* Monthly Chart */}
      <WochenChart refresh={refreshBilanz} />

      {/* Calorie Balance */}
      <KcalBilanzChart refresh={refreshBilanz} />

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onOpenForm={() => setShowForm(true)}
        onOpenWeight={() => setShowWeight(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenSport={() => setShowSport(true)}
      />

      {/* Modals */}
      {showForm && (
        <FloatingForm
          onClose={() => setShowForm(false)}
          onRefresh={refreshAll}
        />
      )}

      {showSettings && (
        <SettingsForm
          onClose={() => {
            setShowSettings(false);
            refreshAll();
          }}
        />
      )}

      {showSport && (
        <SportForm
          onClose={() => setShowSport(false)}
          onRefresh={refreshAll}
        />
      )}

      {showWeight && (
        <GewichtForm
          onClose={() => setShowWeight(false)}
          onRefresh={refreshAll}
        />
      )}

      {/* Tab Bar */}
      {!showForm && !showSettings && !showWeight && !showSport && <FloatingTabBar />}
    </div>
  );
}
