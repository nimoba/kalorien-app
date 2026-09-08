// Status colours for goal progress. pct = value / goal.

export function getProgressColor(pct: number): string {
  if (pct > 1.1) return "#fb7185";      // over
  if (pct >= 0.9) return "#bef264";     // on target
  if (pct >= 0.5) return "#e4e4e7";     // in progress
  return "#a1a1aa";                     // early
}

export function getStatusInfo(pct: number): { color: string; text: string } {
  if (pct > 1.1) return { color: "#fb7185", text: "Drüber" };
  if (pct >= 0.9) return { color: "#bef264", text: "Im Ziel" };
  if (pct >= 0.5) return { color: "#e4e4e7", text: "Unterwegs" };
  return { color: "#a1a1aa", text: "Noch früh" };
}

export const macroColor = {
  protein: "#7dd3fc",
  carbs: "#fcd34d",
  fat: "#f9a8d4",
  kcal: "#bef264",
};

export const chartTheme = {
  grid: "rgba(255,255,255,0.05)",
  tick: "#6f6f7a",
  tooltipBg: "#1c1c21",
  tooltipBorder: "rgba(255,255,255,0.16)",
  font: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
};

export function chartTooltip() {
  return {
    backgroundColor: chartTheme.tooltipBg,
    titleColor: "#f4f4f5",
    bodyColor: "#a1a1aa",
    borderColor: chartTheme.tooltipBorder,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 10,
    displayColors: false,
  };
}

export function chartScales(opts: { beginAtZero?: boolean } = {}) {
  return {
    x: {
      ticks: { color: chartTheme.tick, font: { size: 10, family: chartTheme.font }, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
      grid: { display: false },
      border: { display: false },
    },
    y: {
      beginAtZero: opts.beginAtZero ?? false,
      ticks: { color: chartTheme.tick, font: { size: 10, family: chartTheme.font }, maxTicksLimit: 5 },
      grid: { color: chartTheme.grid },
      border: { display: false },
    },
  };
}
