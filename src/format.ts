/** Compact number: 1000 → "1k", 1230 → "1.2k", 2500000 → "2.5M" */
export function fmtNum(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) {
    const k = n / 1000;
    return (k % 1 < 0.05 ? k.toFixed(0) : k.toFixed(1)) + "k";
  }
  const m = n / 1_000_000;
  return (m % 1 < 0.05 ? m.toFixed(0) : m.toFixed(1)) + "M";
}
