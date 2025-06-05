'use client';
import { getProgressColor } from "../../utils/colors";

interface Props {
  label: string;
  value: number;
  ziel: number;
  farbe: string;
}

export function MakroBalken({ label, value, ziel, farbe }: Props) {
  const prozent = Math.min((value / ziel) * 100, 100);
  const progress = value / ziel;

  // Bewertung
  const bewertung = () => {
    if (progress >= 0.9 && progress <= 1.1) return { farbe: '#27ae60', text: 'Perfect! 🎯' };     // 90-110%
    if (progress >= 0.7 && progress < 0.9) return { farbe: '#2ecc71', text: 'Gut! 👍' };         // 70-90%
    if (progress >= 0.5 && progress < 0.7) return { farbe: '#f39c12', text: 'Ok' };              // 50-70%
    if (progress < 0.5) return { farbe: '#e74c3c', text: 'Zu wenig!' };                         // <50%
    return { farbe: '#e74c3c', text: 'Aufpassen!' };                                            // >110%
  };

  const bewertungInfo = bewertung();

  return (
    <div style={{
      backgroundColor: '#1e1e1e',
      borderRadius: 12,
      padding: 16,
      border: `2px solid ${bewertungInfo.farbe}33`,
      marginBottom: 12,
    }}>
      {/* Content */}
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <p style={{ 
            margin: 0, 
            color: '#fff',
            fontSize: 16,
            fontWeight: '500'
          }}>
            {label}: {Math.round(value)} / {Math.round(ziel)} g
          </p>
          <span style={{
            fontSize: 11,
            color: bewertungInfo.farbe,
            fontWeight: 'bold'
          }}>
            {bewertungInfo.text}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: 12,
          backgroundColor: "#333",
          borderRadius: 12,
          overflow: "hidden",
          position: 'relative'
        }}>
          <div style={{
            width: `${prozent}%`,
            height: "100%",
            backgroundColor: getProgressColor(value / ziel),
            borderRadius: 12,
            transition: "width 0.3s ease",
            position: 'relative'
          }}>
            {/* Glanz-Effekt */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
              borderRadius: '12px 12px 0 0'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}