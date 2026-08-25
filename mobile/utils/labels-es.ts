/**
 * Etiquetas en español para los estados que el backend devuelve en inglés.
 * El backend sigue siendo la autoridad: aquí solo se traduce la etiqueta.
 */

export const loanStatusEs: Record<string, string> = {
  ACTIVE: 'Activo',
  PAID: 'Pagado',
  OVERDUE: 'En mora',
  CANCELLED: 'Cancelado',
};

export const installmentStatusEs: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  PAID: 'Pagada',
  OVERDUE: 'En mora',
  CANCELLED: 'Cancelada',
};

export const classificationEs: Record<string, string> = {
  DUE_TODAY: 'Vence hoy',
  OVERDUE: 'Vencida',
  UPCOMING: 'Próxima',
  PAID: 'Pagada',
};

export const paymentMethodEs: Record<string, string> = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  OTHER: 'Otro',
};

export const frequencyEs: Record<string, string> = {
  ONCE: 'Una vez',
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  BIWEEKLY: 'Quincenal',
  MONTHLY: 'Mensual',
  CUSTOM: 'Personalizada',
};

export const amortizationEs: Record<string, string> = {
  FIXED_PRINCIPAL: 'Capital fijo',
  FRENCH: 'Francés',
};
