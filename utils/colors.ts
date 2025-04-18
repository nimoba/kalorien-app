export function getProgressColor(pct: number): string {
    if (pct > 1.1) return "#d62e79";     // Overshoot
    if (pct >= 0.9) return "#3cb043";    // Dark Green
    if (pct >= 0.7) return "#7ed957";    // Light Green
    if (pct >= 0.5) return "#f4d35e";    // Yellow
    return "#faae42";                    // Orange
  }

export function getOvershootColor(val: number, ziel: number, normal: string): string {
  return val / ziel > 1.1 ? "#d62e79" : normal;
}
