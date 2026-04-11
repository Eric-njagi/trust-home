/** Format numeric amounts as Kenyan Shillings for display. */
export function formatKes(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return 'KSh 0';
  return `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
