import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  full_name: z.string().trim().min(1, 'Ingresa tu nombre completo').max(255, 'Máximo 255 caracteres'),
  email: z.string().trim().min(1, 'Ingresa tu correo').email('Ingresa un correo válido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128, 'Máximo 128 caracteres'),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
