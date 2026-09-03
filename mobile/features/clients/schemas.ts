import { z } from 'zod';

export const clientFormSchema = z.object({
  full_name: z.string().trim().min(1, 'El nombre es obligatorio').max(255, 'Máximo 255 caracteres'),
  phone: z.string().trim().min(1, 'El teléfono es obligatorio').max(32, 'Máximo 32 caracteres'),
});

export type ClientFormData = z.infer<typeof clientFormSchema>;

export const referenceFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  phone: z.string().trim().max(32, 'Máximo 32 caracteres').optional(),
  relationship: z.string().trim().max(64, 'Máximo 64 caracteres').optional(),
});

export type ReferenceFormData = z.infer<typeof referenceFormSchema>;
