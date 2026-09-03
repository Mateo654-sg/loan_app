import { z } from 'zod';

const amount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Ingresa un monto válido. Ej: 1.000.000')
  .refine((v) => parseFloat(v) > 0, 'El monto debe ser mayor a 0');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD');

export const FREQUENCIES = ['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const PERIOD_BY_FREQUENCY: Record<Frequency, string> = {
  ONCE: 'MONTHLY',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
};

export const loanFormSchema = z
  .object({
    client_id: z.string().uuid('Selecciona un cliente'),
    principal: amount,
    start_date: isoDate,
    interest_rate: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Ingresa un porcentaje válido')
      .refine((v) => parseFloat(v) >= 0, 'No puede ser negativo')
      .refine((v) => parseFloat(v) <= 100, 'Máximo 100% por cuota'),
    payment_frequency: z.enum(FREQUENCIES),
    number_of_installments: z
      .string()
      .min(1, 'Requerido')
      .regex(/^\d+$/, 'Solo números enteros')
      .refine((v: string) => Number(v) >= 1 && Number(v) <= 360, 'Entre 1 y 360 cuotas'),
    first_due_date: isoDate,
    late_fee_enabled: z.boolean(),
    late_fee_type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'DAILY_PERCENTAGE']),
    late_fee_value: z.string().optional(),
    late_fee_grace_days: z.string().regex(/^\d*$/, 'Solo días enteros').optional(),
  })
  .refine((data) => !data.late_fee_enabled || (data.late_fee_value ?? '').trim().length > 0, {
    message: 'Ingresa el valor de mora',
    path: ['late_fee_value'],
  });

export type LoanFormData = z.infer<typeof loanFormSchema>;
