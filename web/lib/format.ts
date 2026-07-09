export function compact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return trim(n / 1e12) + "T";
  if (abs >= 1e9) return trim(n / 1e9) + "B";
  if (abs >= 1e6) return trim(n / 1e6) + "M";
  if (abs >= 1e3) return trim(n / 1e3) + "K";
  return String(Math.round(n));
}

function trim(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}

export function withCommas(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function usd(n: number): string {
  if (n >= 1000) return "$" + compact(n);
  return "$" + n.toFixed(2).replace(/\.00$/, "");
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const s = Math.max(1, Math.round((Date.now() - then) / 1000));
  if (s < 60) return s + "s";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m";
  const h = Math.round(m / 60);
  if (h < 24) return h + "h";
  const d = Math.round(h / 24);
  if (d < 7) return d + "d";
  const w = Math.round(d / 7);
  if (w < 5) return w + "w";
  const mo = Math.round(d / 30);
  return mo + "mo";
}

// Rough $ estimate if the user doesn't provide one (blended output-ish rate).
export function estimateCost(tokens: number): number {
  return (tokens / 1_000_000) * 6;
}

// Monochrome avatar initials from a display name or handle.
export function initials(name: string): string {
  const clean = name.replace(/^@+/, "").trim();
  if (!clean) return "?";
  const parts = clean.split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}
