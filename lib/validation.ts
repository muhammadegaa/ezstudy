import { z } from 'zod';

// Email validation schema
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(128, 'Password must be less than 128 characters');

// Display name validation schema
export const displayNameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .optional();

// Sign up validation schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

// Sign in validation schema
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Reset password validation schema
export const resetPasswordSchema = z.object({
  email: emailSchema,
});

// Tutor profile validation schema
export const tutorProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  subjects: z.array(z.string()).min(1, 'At least one subject is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  bio: z.string().min(10, 'Bio must be at least 10 characters').max(500),
  pricePerHour: z.number().min(0, 'Price must be positive'),
});

// Session validation schema
export const sessionSchema = z.object({
  tutorId: z.string().min(1, 'Tutor ID is required'),
  subject: z.string().min(1, 'Subject is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type TutorProfileInput = z.infer<typeof tutorProfileSchema>;
export type SessionInput = z.infer<typeof sessionSchema>;

