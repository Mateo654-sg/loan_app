/**
 * Formateo monetario premium — separadores de miles consistentes en toda la app.
 * Diseño: es-CO, COP, 0 decimales, símbolo $ con espacio fino.
 * Nunca usar para cálculos financieros — solo presentación (DESIGN_SYSTEM §20).
 */

// Formatter singleton — español Colombia, peso colombiano
const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

const COP_COMPACT = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

// Con decimales para montos precisos (ej: interés)
const COP_DECIMAL = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

export function formatMoneyCop(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$ 0';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '$ 0';
  if (numeric === 0) return '$ 0';
  return COP_FORMATTER.format(numeric);
}

export function formatMoneyCopWithDecimals(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$ 0,00';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '$ 0,00';
  return COP_DECIMAL.format(numeric);
}

export function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '0';
  return NUMBER_FORMATTER.format(numeric);
}

export function formatCompactCop(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$ 0';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '$ 0';
  if (Math.abs(numeric) < 1000) return COP_FORMATTER.format(numeric);
  // Para compacto, usar es-CO manualmente para evitar "K" inglés
  if (Math.abs(numeric) >= 1_000_000_000) return `$ ${(numeric / 1_000_000_000).toFixed(1).replace('.', ',')} B`;
  if (Math.abs(numeric) >= 1_000_000) return `$ ${(numeric / 1_000_000).toFixed(1).replace('.', ',')} M`;
  if (Math.abs(numeric) >= 1_000) return `$ ${(numeric / 1_000).toFixed(1).replace('.', ',')} mil`;
  return COP_FORMATTER.format(numeric);
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '0%';
  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) return '0%';
  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(numeric)}%`;
}

// Helpers financieros puros — sin floats peligrosos para UI, solo display
export function parseMoneyToNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export function safeAdd(a: string, b: string): string {
  // Suma precisa con centavos para display (evita 0.1+0.2)
  const pa = Math.round(parseMoneyToNumber(a) * 100);
  const pb = Math.round(parseMoneyToNumber(b) * 100);
  return ((pa + pb) / 100).toFixed(2);
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
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthIndex = parseInt(month, 10) - 1;
  return `${day} ${monthNames[monthIndex] ?? month} ${year}`;
}

export function formatIsoDateLong(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthIndex = parseInt(month, 10) - 1;
  return `${day} de ${monthNames[monthIndex] ?? month} de ${year}`;
}
