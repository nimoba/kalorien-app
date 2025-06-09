'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  achievedDate?: string;
}

interface WeekHabit {
  datum: string;
  foodLogged: boolean;
  weightLogged: boolean;
  completed: boolean;
}

interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  achievements: Achievement[];
  weekData: WeekHabit[];
}

interface Props {
  refresh?: number;
}

export default function HabitTracker({ refresh }: Props) {
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAchievements, setShowAchievements] = useState(false);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/habits');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Habit-Statistiken:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refresh]);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>📊 Gewohnheiten</span>
          <div style={loaderStyle}>⏳</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span>📊 Gewohnheiten</span>
          <span style={{ color: '#ff6b6b', fontSize: 14 }}>Fehler beim Laden</span>
        </div>
      </div>
    );
  }

  const streakColor = stats.currentStreak >= 7 ? '#4caf50' : stats.currentStreak >= 3 ? '#ff9800' : '#2196f3';
  const achievedCount = stats.achievements.filter(a => a.achieved).length;

  return (
    <motion.div
      style={containerStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <span>📊 Gewohnheiten</span>
        <button 
          onClick={() => setShowAchievements(!showAchievements)}
          style={achievementButtonStyle}
        >
          🏆 {achievedCount}/{stats.achievements.length}
        </button>
      </div>

      {/* Streak Display */}
      <div style={streakContainerStyle}>
        <motion.div 
          style={{ ...streakCircleStyle, borderColor: streakColor }}
          animate={{ scale: stats.currentStreak > 0 ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: stats.currentStreak >= 7 ? Infinity : 0, repeatDelay: 2 }}
        >
          <div style={{ fontSize: 24, fontWeight: 'bold', color: streakColor }}>
            {stats.currentStreak}
          </div>
          <div style={{ fontSize: 12, color: '#ccc' }}>
            {stats.currentStreak === 1 ? 'Tag' : 'Tage'}
          </div>
          {stats.currentStreak >= 7 && (
            <motion.div
              style={fireIconStyle}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              🔥
            </motion.div>
          )}
        </motion.div>

        <div style={streakStatsStyle}>
          <div style={statItemStyle}>
            <span style={{ color: '#4caf50' }}>🏆 Rekord</span>
            <span>{stats.longestStreak} Tage</span>
          </div>
          <div style={statItemStyle}>
            <span style={{ color: '#2196f3' }}>📅 Gesamt</span>
            <span>{stats.totalDays} Tage</span>
          </div>
        </div>
      </div>

      {/* Week View */}
      <div style={weekContainerStyle}>
        <div style={{ fontSize: 14, color: '#ccc', marginBottom: 8 }}>
          Letzte 7 Tage
        </div>
        <div style={weekGridStyle}>
          {stats.weekData.map((day, index) => {
            const date = new Date(day.datum);
            const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
            const isToday = day.datum === new Date().toLocaleDateString("de-DE", {timeZone: "Europe/Berlin"});
            
            return (
              <motion.div
                key={day.datum}
                style={{
                  ...dayItemStyle,
                  backgroundColor: day.completed ? '#4caf50' : '#333',
                  border: isToday ? '2px solid #2196f3' : '1px solid #555',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <div style={{ fontSize: 10, color: '#ccc' }}>{dayName}</div>
                <div style={{ fontSize: 16 }}>
                  {day.completed ? (
                    <span>
                      {day.foodLogged && '🍽️'}
                      {day.weightLogged && '⚖️'}
                      {!day.foodLogged && !day.weightLogged && '✅'}
                    </span>
                  ) : (
                    '○'
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <motion.div
          style={achievementModalStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAchievements(false)}
        >
          <motion.div
            style={achievementContentStyle}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: '#fff' }}>🏆 Erfolge</h3>
              <button onClick={() => setShowAchievements(false)} style={closeButtonStyle}>✕</button>
            </div>
            
            <div style={achievementGridStyle}>
              {stats.achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  style={{
                    ...achievementItemStyle,
                    opacity: achievement.achieved ? 1 : 0.4,
                    borderColor: achievement.achieved ? '#4caf50' : '#555',
                  }}
                  whileHover={{ scale: achievement.achieved ? 1.05 : 1 }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{achievement.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                    {achievement.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#ccc', textAlign: 'center' }}>
                    {achievement.description}
                  </div>
                  {achievement.achieved && (
                    <div style={{ fontSize: 10, color: '#4caf50', marginTop: 4 }}>
                      ✅ Erreicht
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Motivational Message */}
      <div style={motivationStyle}>
        {getMotivationalMessage(stats.currentStreak)}
      </div>
    </motion.div>
  );
}

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return "💪 Starte heute deine Gewohnheit!";
  if (streak === 1) return "🌱 Großartiger Start! Bleib dran!";
  if (streak < 7) return `🔥 ${streak} Tage! Du bist auf dem richtigen Weg!`;
  if (streak < 30) return `🚀 ${streak} Tage Streak! Du bist unstoppbar!`;
  return `👑 ${streak} Tage! Du bist ein wahrer Champion!`;
}

// Styles
const containerStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 16,
  padding: 20,
  marginTop: 20,
  border: '1px solid #444',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  fontSize: 18,
  fontWeight: 'bold',
  color: '#fff',
};

const achievementButtonStyle: React.CSSProperties = {
  backgroundColor: '#ff9800',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '4px 8px',
  fontSize: 12,
  cursor: 'pointer',
};

const loaderStyle: React.CSSProperties = {
  fontSize: 14,
  color: '#ccc',
};

const streakContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  marginBottom: 20,
};

const streakCircleStyle: React.CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: '50%',
  border: '3px solid',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  backgroundColor: '#1e1e1e',
};

const fireIconStyle: React.CSSProperties = {
  position: 'absolute',
  top: -5,
  right: -5,
  fontSize: 16,
};

const streakStatsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 14,
  color: '#fff',
};

const weekContainerStyle: React.CSSProperties = {
  marginBottom: 16,
};

const weekGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: 8,
};

const dayItemStyle: React.CSSProperties = {
  aspectRatio: '1',
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  color: '#fff',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const motivationStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 14,
  color: '#4caf50',
  fontStyle: 'italic',
  padding: '8px 0',
  borderTop: '1px solid #444',
  marginTop: 8,
  paddingTop: 12,
};

const achievementModalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const achievementContentStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: 16,
  padding: 24,
  maxWidth: '90vw',
  maxHeight: '80vh',
  overflowY: 'auto',
  border: '1px solid #444',
};

const closeButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: '#fff',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
};

const achievementGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: 12,
  maxHeight: '60vh',
  overflowY: 'auto',
};

const achievementItemStyle: React.CSSProperties = {
  backgroundColor: '#1e1e1e',
  border: '2px solid',
  borderRadius: 12,
  padding: 16,
  textAlign: 'center',
  color: '#fff',
  transition: 'all 0.3s ease',
};