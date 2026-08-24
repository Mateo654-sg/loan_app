import { z } from 'zod';

export const clientFormSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(255),
  document_number: z.string().trim().max(64).optional(),
  phone: z.string().trim().max(32).optional(),
  alternative_phone: z.string().trim().max(32).optional(),
  email: z
    .union([z.string().trim().email('Enter a valid email'), z.literal('')])
    .optional(),
  address: z.string().trim().max(255).optional(),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const referenceFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  phone: z.string().trim().max(32).optional(),
  relationship: z.string().trim().max(64).optional(),
});

export type ReferenceFormData = z.infer<typeof referenceFormSchema>;
