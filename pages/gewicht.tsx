'use client';

import { useEffect, useState } from "react";
import FloatingTabBar from "../components/FloatingTabBar";
import { motion, AnimatePresence } from "framer-motion";
import { Line } from "react-chartjs-2";
import GewichtKomponentenChart from "../components/charts/GewichtKomponentenChart";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface GewichtVerlaufEntry {
  datum: string;
  gewicht: number;
}

interface GewichtKomponentEntry {
  datum: string;
  wert: number;
}

interface GewichtData {
  startgewicht: number;
  verlauf: GewichtVerlaufEntry[];
  theoretisch: GewichtVerlaufEntry[];
  geglättet: GewichtVerlaufEntry[];
  trend: GewichtVerlaufEntry[];
  trendSteigung: number;
  fett: GewichtKomponentEntry[];
  muskel: GewichtKomponentEntry[];
  zielGewicht: number;
}

export default function GewichtSeite() {
  const [data, setData] = useState<GewichtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyse, setAnalyse] = useState<string | null>(null);
  const [analyseLoading, setAnalyseLoading] = useState(false);

  useEffect(() => {
    fetch("/api/weight-history")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAnalyse = async () => {
    setAnalyseLoading(true);
    const res = await fetch("/api/analyse", { method: "POST" });
    const d = await res.json();
    setAnalyse(d.analyse || "Keine Analyse verfügbar");
    setAnalyseLoading(false);
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingContainerStyle}>
          <div style={spinnerStyle} />
          <span style={{ color: '#71717a', fontSize: 14 }}>Lade Gewichtsdaten...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <FloatingTabBar />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={containerStyle}>
        <div style={errorContainerStyle}>
          <div style={errorIconStyle}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p style={{ color: '#fff', margin: '16px 0 8px 0', fontWeight: 600 }}>Keine Daten verfügbar</p>
          <p style={{ color: '#71717a', margin: 0, fontSize: 14 }}>Gewichtsdaten konnten nicht geladen werden</p>
        </div>
        <FloatingTabBar />
      </div>
    );
  }

  const {
    startgewicht,
    verlauf,
    theoretisch,
    geglättet,
    trend,
    trendSteigung,
    fett,
    muskel,
    zielGewicht
  } = data;

  const labels = verlauf.map((e) => e.datum);
  const echteWerte = verlauf.map((e) => e.gewicht);
  const theoriewerte = theoretisch.map((e) => e.gewicht);
  const smoothed = geglättet.map((e) => e.gewicht);
  const trendlinie = trend.map((e) => e.gewicht);

  const letzte = echteWerte[echteWerte.length - 1] || startgewicht;
  const diff = (letzte - startgewicht).toFixed(1);
  const diffNum = parseFloat(diff);

  // Status info based on weight change
  const getStatusInfo = () => {
    if (diffNum <= -5) return { color: '#10b981', text: 'Excellent', icon: 'trending-down' };
    if (diffNum <= -1) return { color: '#22c55e', text: 'Sehr gut', icon: 'trending-down' };
    if (diffNum >= -0.5 && diffNum <= 0.5) return { color: '#f59e0b', text: 'Stabil', icon: 'minus' };
    if (diffNum >= 1) return { color: '#ef4444', text: 'Aufpassen', icon: 'trending-up' };
    return { color: '#71717a', text: 'Ok', icon: 'minus' };
  };

  const statusInfo = getStatusInfo();

  // Goal progress calculation
  const zielDifferenz = letzte - zielGewicht;
  const verbleibendeTage = (trendSteigung !== 0 && zielGewicht)
    ? Math.ceil(Math.abs(zielDifferenz) / Math.abs(trendSteigung))
    : null;

  const zieltext =
    !zielGewicht
      ? "Kein Zielgewicht definiert"
      : verbleibendeTage && verbleibendeTage > 0 && Math.abs(trendSteigung) > 0.001
        ? `Zielgewicht in ca. ${verbleibendeTage} Tagen`
        : "Zielgewicht erreicht oder Trend zu flach";

  const chartData = {
    labels,
    datasets: [
      {
        label: "Tatsächliches Gewicht",
        data: echteWerte,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "#6366f1",
      },
      {
        label: "Theoretisch (Kcal-basiert)",
        data: theoriewerte,
        borderColor: "#f472b6",
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.2,
        borderWidth: 2,
      },
      {
        label: "7-Tage Ø",
        data: smoothed,
        borderColor: "#fbbf24",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        tension: 0.25,
      },
      {
        label: "Trendlinie",
        data: trendlinie,
        borderColor: "#8b5cf6",
        borderDash: [2, 4],
        pointRadius: 0,
        borderWidth: 2,
        tension: 0,
      },
      ...(zielGewicht ? [{
        label: "Zielgewicht",
        data: new Array(labels.length).fill(zielGewicht),
        borderColor: "rgba(255, 255, 255, 0.3)",
        borderWidth: 1,
        pointRadius: 0,
        borderDash: [2, 2],
        tension: 0,
      }] : [])
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: '#71717a',
          font: { size: 11, family: 'Inter, sans-serif' },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        backgroundColor: 'rgba(28, 28, 38, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (context: import("chart.js").TooltipItem<"line">) =>
            `${context.dataset.label}: ${context.formattedValue} kg`,
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        ticks: { color: '#52525b', font: { size: 10, family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { display: false },
      },
      y: {
        beginAtZero: false,
        ticks: { color: '#52525b', font: { size: 10, family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { display: false },
      },
    },
  };

  // Body composition chart
  const koerperChartData = {
    labels: verlauf.map((e) => e.datum),
    datasets: [
      {
        label: "Körperfett (%)",
        data: fett.map((e) => e.wert),
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        fill: true,
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "#f97316",
      },
      {
        label: "Muskelmasse (%)",
        data: muskel.map((e) => e.wert),
        borderColor: "#10b981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.25,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: "#10b981",
      },
    ],
  };

  const koerperOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: '#71717a',
          font: { size: 11, family: 'Inter, sans-serif' },
          usePointStyle: true,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(28, 28, 38, 0.95)',
        titleColor: '#fff',
        bodyColor: '#a1a1aa',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        ticks: { color: '#52525b', font: { size: 10, family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { display: false },
      },
      y: {
        beginAtZero: false,
        ticks: { color: '#52525b', font: { size: 10, family: 'Inter, sans-serif' } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { display: false },
      },
    },
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={headerStyle}
      >
        <div>
          <h1 style={titleStyle}>Gewicht</h1>
          <p style={subtitleStyle}>Dein Fortschritt im Überblick</p>
        </div>
        <div style={{
          background: `${statusInfo.color}15`,
          padding: '8px 14px',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusInfo.color,
          }} />
          <span style={{
            fontSize: 13,
            color: statusInfo.color,
            fontWeight: 600,
          }}>
            {statusInfo.text}
          </span>
        </div>
      </motion.div>

      {/* Main Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={mainStatsCardStyle}
      >
        <div style={statsGridStyle}>
          <div style={statItemStyle}>
            <span style={{ ...statNumberStyle, color: statusInfo.color }}>
              {diffNum < 0 ? '' : '+'}{diff}
            </span>
            <span style={statLabelStyle}>kg {diffNum < 0 ? 'abgenommen' : 'zugenommen'}</span>
          </div>
          <div style={statItemStyle}>
            <span style={statNumberStyle}>{letzte.toFixed(1)}</span>
            <span style={statLabelStyle}>Aktuell (kg)</span>
          </div>
          {zielGewicht && (
            <div style={statItemStyle}>
              <span style={statNumberStyle}>{zielGewicht}</span>
              <span style={statLabelStyle}>Ziel (kg)</span>
            </div>
          )}
        </div>

        {/* Goal Progress */}
        <div style={goalProgressStyle}>
          <div style={goalIconStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <span style={{ color: '#a1a1aa', fontSize: 14 }}>{zieltext}</span>
        </div>
      </motion.div>

      {/* AI Analysis Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        onClick={handleAnalyse}
        disabled={analyseLoading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={analyseButtonStyle}
      >
        {analyseLoading ? (
          <>
            <div style={buttonSpinnerStyle} />
            Analysiere...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 2a10 10 0 0 1 10 10" />
              <circle cx="12" cy="12" r="6" />
            </svg>
            GPT-Analyse anzeigen
          </>
        )}
      </motion.button>

      {/* Analysis Result */}
      <AnimatePresence>
        {analyse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={analyseCardStyle}
          >
            <div style={analyseHeaderStyle}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span style={{ color: '#fff', fontWeight: 600 }}>KI-Analyse</span>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{analyse}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weight Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={chartCardStyle}
      >
        <div style={chartHeaderStyle}>
          <div>
            <h3 style={chartTitleStyle}>Gewichtsverlauf</h3>
            <p style={chartSubtitleStyle}>Trend über Zeit</p>
          </div>
          <div style={chartIconStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
        </div>
        <div style={{ height: '300px' }}>
          <Line data={chartData} options={options} />
        </div>
      </motion.div>

      {/* Body Composition Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={chartCardStyle}
      >
        <div style={chartHeaderStyle}>
          <div>
            <h3 style={chartTitleStyle}>Körperzusammensetzung</h3>
            <p style={chartSubtitleStyle}>Fett & Muskelmasse</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={compositionStatStyle}>
              <span style={{ color: '#f97316', fontWeight: 600, fontSize: 16 }}>
                {fett[fett.length - 1]?.wert?.toFixed(1) || 'N/A'}%
              </span>
              <span style={{ color: '#71717a', fontSize: 11 }}>Fett</span>
            </div>
            <div style={compositionStatStyle}>
              <span style={{ color: '#10b981', fontWeight: 600, fontSize: 16 }}>
                {muskel[muskel.length - 1]?.wert?.toFixed(1) || 'N/A'}%
              </span>
              <span style={{ color: '#71717a', fontSize: 11 }}>Muskel</span>
            </div>
          </div>
        </div>
        <div style={{ height: '260px' }}>
          <Line data={koerperChartData} options={koerperOptions} />
        </div>
      </motion.div>

      {/* Body Composition Dashboard */}
      <GewichtKomponentenChart />

      <FloatingTabBar />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// === STYLES ===
const containerStyle: React.CSSProperties = {
  padding: "20px",
  paddingBottom: 100,
  backgroundColor: "#0f0f14",
  minHeight: "100vh",
  color: "#fff",
};

const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  gap: 16,
};

const spinnerStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  border: '3px solid rgba(99, 102, 241, 0.2)',
  borderTopColor: '#6366f1',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const errorContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  textAlign: 'center',
};

const errorIconStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 16,
  background: 'rgba(239, 68, 68, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.03em',
  background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const subtitleStyle: React.CSSProperties = {
  margin: '4px 0 0 0',
  fontSize: 14,
  color: '#71717a',
};

const mainStatsCardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 16,
  marginBottom: 16,
};

const statItemStyle: React.CSSProperties = {
  textAlign: 'center',
};

const statNumberStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 24,
  fontWeight: 700,
  color: '#fff',
  letterSpacing: '-0.03em',
  fontVariantNumeric: 'tabular-nums',
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#71717a',
  marginTop: 4,
  display: 'block',
};

const goalProgressStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingTop: 16,
  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
};

const goalIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  background: 'rgba(139, 92, 246, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const analyseButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  fontSize: 15,
  fontWeight: 600,
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
  color: '#a78bfa',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  marginBottom: 16,
};

const buttonSpinnerStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  border: '2px solid rgba(167, 139, 250, 0.3)',
  borderTopColor: '#a78bfa',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};

const analyseCardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  border: '1px solid rgba(139, 92, 246, 0.2)',
  overflow: 'hidden',
};

const analyseHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 12,
};

const chartCardStyle: React.CSSProperties = {
  background: 'rgba(28, 28, 38, 0.6)',
  borderRadius: 20,
  padding: 20,
  marginBottom: 16,
  border: '1px solid rgba(255, 255, 255, 0.06)',
};

const chartHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16,
};

const chartTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: '-0.02em',
};

const chartSubtitleStyle: React.CSSProperties = {
  margin: '4px 0 0 0',
  fontSize: 12,
  color: '#71717a',
};

const chartIconStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: 'rgba(99, 102, 241, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const compositionStatStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.03)',
  padding: '8px 12px',
  borderRadius: 10,
};
