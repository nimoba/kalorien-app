// Date helpers. The Google Sheet stores dates as German "D.M.YYYY" strings
// (as produced by toLocaleDateString("de-DE")). ISO "YYYY-MM-DD" is used in URLs and inputs.

export function todayDE(): string {
  return new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
}

export function todayISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return parts; // en-CA yields YYYY-MM-DD
}

export function parseDE(s: string): Date | null {
  if (!s) return null;
  const parts = s.trim().split('.');
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  let y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 100) y += 2000;
  return new Date(y, m - 1, d);
}

export function isoToDE(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

export function deToISO(de: string): string {
  const dt = parseDE(de);
  if (!dt) return de;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

/** Normalises any "D.M.YYYY" / "DD.MM.YYYY" / "D.M.YY" into "D.M.YYYY" so keys match. */
export function normalizeDE(s: string): string {
  const dt = parseDE(s);
  if (!dt) return (s || '').trim();
  return `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`;
}

export function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export function formatISOLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatISOShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function isValidISO(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

export function nowTimeDE(): string {
  return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Berlin' });
}
