'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats: {
      totalEntries: number;
      activeDays: number;
      maxStreak: number;
      foodDays: number;
      weightDays: number;
      achievements: Record<string, number>;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runBackfill = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🔄 Starting backfill process...');
      const res = await fetch('/api/backfill-habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      
      if (res.ok) {
        setResult(data);
        console.log('✅ Backfill completed:', data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🔧 Admin Dashboard</h1>
      
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>📊 Habit Data Backfill</h2>
        <p style={descriptionStyle}>
          This will analyze your existing food and weight logs to create historical habit data.
          It will populate the Habits sheet with all your past activities and calculate streaks.
        </p>
        
        <button 
          onClick={runBackfill}
          disabled={loading}
          style={{
            ...buttonStyle,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Processing...' : '🚀 Run Backfill'}
        </button>
      </div>

      {error && (
        <div style={errorStyle}>
          <h3>❌ Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div style={successStyle}>
          <h3>✅ Backfill Completed!</h3>
          <p>{result.message}</p>
          
          <div style={statsStyle}>
            <h4>📈 Statistics:</h4>
            <div style={statGridStyle}>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Total Entries:</span>
                <span style={statValueStyle}>{result.stats.totalEntries}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Active Days:</span>
                <span style={statValueStyle}>{result.stats.activeDays}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Max Streak:</span>
                <span style={statValueStyle}>{result.stats.maxStreak} days</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Food Days:</span>
                <span style={statValueStyle}>{result.stats.foodDays}</span>
              </div>
              <div style={statItemStyle}>
                <span style={statLabelStyle}>Weight Days:</span>
                <span style={statValueStyle}>{result.stats.weightDays}</span>
              </div>
            </div>

            {result.stats.achievements && (
              <div style={achievementsSectionStyle}>
                <h4>🏆 Achievements Found:</h4>
                <div style={achievementsGridStyle}>
                  {Object.entries(result.stats.achievements).map(([achievement, count]) => (
                    <div key={achievement} style={achievementItemStyle}>
                      <span>{achievement}</span>
                      <span style={achievementCountStyle}>{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={nextStepsStyle}>
            <h4>🎯 Next Steps:</h4>
            <ol>
              <li>Go back to the main dashboard</li>
              <li>You should now see your historical streak data</li>
              <li>Check the achievements panel to see what you&apos;ve unlocked</li>
              <li>Your longest streak and total days should reflect your actual usage</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const containerStyle: React.CSSProperties = {
  padding: '40px 24px',
  maxWidth: '800px',
  margin: '0 auto',
  backgroundColor: '#2c2c2c',
  minHeight: '100vh',
  color: '#ffffff',
  fontFamily: 'sans-serif',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2.5rem',
  marginBottom: '2rem',
  textAlign: 'center',
  color: '#fff',
};

const sectionStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #444',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  marginBottom: '16px',
  color: '#4caf50',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '1rem',
  lineHeight: '1.6',
  color: '#ccc',
  marginBottom: '24px',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: '#4caf50',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  padding: '16px 32px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

const errorStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
  border: '2px solid #f44336',
  color: '#f44336',
};

const successStyle: React.CSSProperties = {
  backgroundColor: '#2a2a2a',
  borderRadius: '16px',
  padding: '24px',
  marginBottom: '24px',
  border: '2px solid #4caf50',
};

const statsStyle: React.CSSProperties = {
  marginTop: '20px',
};

const statGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '12px',
  marginBottom: '20px',
};

const statItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '12px',
  backgroundColor: '#1e1e1e',
  borderRadius: '8px',
  border: '1px solid #444',
};

const statLabelStyle: React.CSSProperties = {
  color: '#ccc',
};

const statValueStyle: React.CSSProperties = {
  color: '#4caf50',
  fontWeight: 'bold',
};

const achievementsSectionStyle: React.CSSProperties = {
  marginTop: '20px',
};

const achievementsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '8px',
  marginTop: '12px',
};

const achievementItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 12px',
  backgroundColor: '#1e1e1e',
  borderRadius: '6px',
  fontSize: '0.9rem',
};

const achievementCountStyle: React.CSSProperties = {
  color: '#ff9800',
  fontWeight: 'bold',
};

const nextStepsStyle: React.CSSProperties = {
  marginTop: '24px',
  padding: '16px',
  backgroundColor: '#1e1e1e',
  borderRadius: '8px',
  border: '1px solid #2196f3',
};