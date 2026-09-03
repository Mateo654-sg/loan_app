import { z } from 'zod';

const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Monto inválido. Ej: 50000 o 50000,50')
  .refine((value) => parseFloat(value) > 0, 'Debe ser mayor a 0');

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD');

export const transactionFormSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: amountSchema,
  category_id: z.string().uuid('Selecciona una categoría'),
  transaction_date: isoDateSchema,
  description: z.string().trim().max(255, 'Máximo 255 caracteres').optional(),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER']).nullable(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const goalFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  target_amount: amountSchema,
  target_date: z.union([isoDateSchema, z.literal('')]).optional(),
});

export type GoalFormData = z.infer<typeof goalFormSchema>;

export const contributionFormSchema = z.object({
  amount: amountSchema,
});

export type ContributionFormData = z.infer<typeof contributionFormSchema>;
