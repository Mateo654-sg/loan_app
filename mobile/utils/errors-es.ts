import { ApiError } from '@/services/api/client';

/**
 * Traducción de errores del backend a mensajes claros en español.
 * El código (error.code) es la clave estable; el texto del servidor
 * es secundario y no se muestra al usuario directamente.
 */
const MESSAGES: Record<string, string> = {
  // Auth
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_ALREADY_REGISTERED: 'Ya existe una cuenta con este correo.',
  REGISTRATION_DISABLED: 'Los registros están cerrados en este servidor.',
  NOT_AUTHENTICATED: 'Tu sesión expiró. Inicia sesión de nuevo.',
  INVALID_TOKEN: 'Tu sesión no es válida. Inicia sesión de nuevo.',
  INVALID_REFRESH_TOKEN: 'Tu sesión expiró. Inicia sesión de nuevo.',
  USER_INACTIVE: 'Esta cuenta está desactivada.',

  // Categorías / transacciones
  CATEGORY_ALREADY_EXISTS: 'Ya tienes una categoría activa con ese nombre y tipo.',
  CATEGORY_INACTIVE: 'Esa categoría está inactiva; elige otra para el nuevo movimiento.',
  CATEGORY_TYPE_MISMATCH: 'El tipo de categoría no coincide con el tipo de movimiento.',
  TRANSACTION_ALREADY_CANCELLED: 'Este movimiento ya estaba cancelado.',
  CATEGORY_MISSING: 'Falta una categoría del sistema. Contacta soporte.',

  // Metas
  GOAL_ALREADY_CANCELLED: 'La meta ya estaba cancelada.',
  CONTRIBUTION_ALREADY_REVERSED: 'Este aporte ya fue revertido.',

  // Préstamos
  INVALID_LOAN_CONFIGURATION: 'La configuración del préstamo no es válida.',
  LOAN_CANCELLED: 'No se puede operar sobre un préstamo cancelado.',
  LOAN_ALREADY_PAID: 'Este préstamo ya está totalmente pagado.',
  LOAN_ALREADY_CANCELLED: 'El préstamo ya está cancelado.',
  INVALID_INSTALLMENT_STATE: 'La cuota indicada no pertenece a este préstamo o no es válida.',

  // Pagos
  PAYMENT_AMOUNT_INVALID: 'El monto del pago debe ser mayor que cero.',
  PAYMENT_EXCEEDS_ALLOWED_AMOUNT: 'El monto excede lo permitido.',
  INSTALLMENT_ALREADY_PAID: 'Esa cuota ya está pagada.',
  PAYMENT_ALREADY_REVERSED: 'Este pago ya fue reversado.',

  // Clientes
  CLIENT_ALREADY_INACTIVE: 'El cliente ya está inactivo.',
  REFERENCE_ALREADY_INACTIVE: 'La referencia ya está inactiva.',

  // Genéricos del backend
  RESOURCE_NOT_FOUND: 'No encontramos este registro (puede pertenecer a otro usuario).',
  VALIDATION_ERROR: 'Revisa los datos del formulario.',
  INVALID_STATE: 'La operación no es válida en el estado actual.',
  RATE_LIMITED: 'Demasiados intentos. Espera un minuto e inténtalo otra vez.',
  INTERNAL_ERROR: 'Error del servidor. Intenta de nuevo en unos momentos.',
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
    if (error.status === 400 || error.status === 422)
      return 'Revisa los datos e inténtalo otra vez.';
    if (error.status !== undefined && error.status >= 500)
      return 'Error del servidor. Intenta de nuevo en unos momentos.';
    return error.message;
  }
  return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
}
