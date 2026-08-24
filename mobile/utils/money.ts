/**
 * Presentation-only money formatting (DESIGN_SYSTEM.md §20).
 * Values arrive as backend-serialized strings ("85000.00") and are never
 * used as the source of financial calculations in this app.
 */
export function formatMoneyCop(value: string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$0';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(numeric);
}

export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatIsoDateShort(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${day} ${monthNames[monthIndex] ?? month} ${year}`;
}
