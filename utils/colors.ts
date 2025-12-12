// Modern Color Utility Functions

export function getProgressColor(pct: number): string {
  if (pct > 1.1) return "#ef4444";      // Danger red (overshoot)
  if (pct >= 0.9) return "#10b981";     // Success green
  if (pct >= 0.7) return "#22c55e";     // Light green
  if (pct >= 0.5) return "#f59e0b";     // Warning orange
  return "#f97316";                      // Orange
}

export function getProgressGradient(pct: number): string {
  if (pct > 1.1) return "linear-gradient(135deg, #ef4444 0%, #f87171 100%)";
  if (pct >= 0.9) return "linear-gradient(135deg, #10b981 0%, #34d399 100%)";
  if (pct >= 0.7) return "linear-gradient(135deg, #22c55e 0%, #4ade80 100%)";
  if (pct >= 0.5) return "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)";
  return "linear-gradient(135deg, #f97316 0%, #fb923c 100%)";
}

export function getOvershootColor(val: number, ziel: number, normal: string): string {
  return val / ziel > 1.1 ? "#ef4444" : normal;
}

export function getBorderColor(pct: number): string {
  if (pct > 1.1) return "rgba(239, 68, 68, 0.5)";    // Red at >110%
  if (pct >= 0.9) return "rgba(16, 185, 129, 0.5)";  // Green at 90-110%
  if (pct >= 0.7) return "rgba(34, 197, 94, 0.5)";   // Light green at 70-90%
  if (pct >= 0.5) return "rgba(245, 158, 11, 0.5)";  // Orange at 50-70%
  return "rgba(249, 115, 22, 0.5)";                   // Orange at <50%
}

export function getTextColor(pct: number): string {
  if (pct > 1.1) return "#f87171";   // Light red at >110%
  return "#ffffff";                   // White otherwise
}

export function getStatusInfo(pct: number): { color: string; text: string; gradient: string } {
  if (pct >= 0.9 && pct <= 1.1) return {
    color: '#10b981',
    text: 'Perfect',
    gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
  };
  if (pct >= 0.7 && pct < 0.9) return {
    color: '#22c55e',
    text: 'Good',
    gradient: 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
  };
  if (pct >= 0.5 && pct < 0.7) return {
    color: '#f59e0b',
    text: 'Moderate',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
  };
  if (pct < 0.5) return {
    color: '#f97316',
    text: 'Low',
    gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
  };
  return {
    color: '#ef4444',
    text: 'Over',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
  };
}
