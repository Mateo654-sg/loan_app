import { z } from 'zod';

/** Matches backend contract: decimal string with up to 2 places, > 0. */
const amountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount, e.g. 50000 or 50000.50')
  .refine((value) => parseFloat(value) > 0, 'Amount must be greater than zero');

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD date format');

export const transactionFormSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: amountSchema,
  category_id: z.string().uuid('Select a category'),
  transaction_date: isoDateSchema,
  description: z.string().trim().max(255).optional(),
  payment_method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'OTHER']).nullable(),
});

export type TransactionFormData = z.infer<typeof transactionFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const goalFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  target_amount: amountSchema,
  target_date: z.union([isoDateSchema, z.literal('')]).optional(),
});

export type GoalFormData = z.infer<typeof goalFormSchema>;

export const contributionFormSchema = z.object({
  amount: amountSchema,
});

export type ContributionFormData = z.infer<typeof contributionFormSchema>;
