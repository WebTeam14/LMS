import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  tenantId: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'Institution ID must be a 24-character hexadecimal identifier',
    }),
});

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(50, 'First name cannot exceed 50 characters'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(50, 'Last name cannot exceed 50 characters'),
    email: z
      .string()
      .trim()
      .min(1, 'Institutional email is required')
      .email('Please enter a valid email address'),
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password'),
    tenantId: z
      .string()
      .trim()
      .min(1, 'Institution / Tenant ID is required')
      .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character hex ID'),
    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must accept the institutional terms of use',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  tenantId: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9a-fA-F]{24}$/.test(val), {
      message: 'Institution ID must be a 24-character hexadecimal identifier',
    }),
});

export const resetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .min(1, 'Reset token is required'),
    newPassword: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, 'Verification token is required'),
});
