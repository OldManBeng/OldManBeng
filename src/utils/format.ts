/** Chinese-yuan money formatting. This game deals in realistic small amounts. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const n = Math.abs(Math.round(amount));
  if (n >= 10000) return `${sign}${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`;
  return `${sign}${n.toLocaleString('zh-CN')}元`;
}

/** Night-chat clock stamp. */
export function nightStamp(baseHour: number, minutesAhead: number): string {
  const total = baseHour * 60 + minutesAhead;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
