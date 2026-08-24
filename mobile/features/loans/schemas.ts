import { z } from 'zod';

const amount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount, e.g. 1000000')
  .refine((v) => parseFloat(v) > 0, 'Amount must be greater than zero');

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format');

export const FREQUENCIES = ['ONCE', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

/**
 * v1.0 backend rule: the configured rate is applied once per installment,
 * so the interest period must match the payment frequency. The form derives
 * it automatically instead of letting users create invalid combinations.
 */
export const PERIOD_BY_FREQUENCY: Record<Frequency, string> = {
  ONCE: 'MONTHLY',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
};

export const loanFormSchema = z
  .object({
    client_id: z.string().uuid('Select a customer'),
    principal: amount,
    start_date: isoDate,
    interest_rate: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid percentage')
      .refine((v) => parseFloat(v) >= 0, 'Rate cannot be negative'),
    amortization_type: z.enum(['FIXED_PRINCIPAL', 'FRENCH']),
    payment_frequency: z.enum(FREQUENCIES),
    // Numeric inputs stay strings for RHF/Zod v4 typing; converted on submit.
    number_of_installments: z
      .string()
      .min(1, 'Installment count is required')
      .regex(/^\d+$/, 'Enter a whole number')
      .refine((v) => Number(v) >= 1 && Number(v) <= 360, 'Between 1 and 360 installments'),
    first_due_date: isoDate,
    late_fee_enabled: z.boolean(),
    late_fee_type: z.enum(['FIXED_AMOUNT', 'PERCENTAGE', 'DAILY_PERCENTAGE']),
    late_fee_value: z.string().optional(),
    late_fee_grace_days: z
      .string()
      .regex(/^\d*$/, 'Whole days only')
      .optional(),
  })
  .refine((data) => !data.late_fee_enabled || (data.late_fee_value ?? '').trim().length > 0, {
    message: 'Late fee value is required when enabled',
    path: ['late_fee_value'],
  });

export type LoanFormData = z.infer<typeof loanFormSchema>;
