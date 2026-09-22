import { z } from 'zod';

const passwordComplexity = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Valid email is required'),
  password: passwordComplexity,
  tenantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Valid 24-character hex Tenant ID is required'),
  roleCode: z.string().trim().toUpperCase().optional().default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Valid 24-character hex Tenant ID')
    .optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordComplexity,
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  tenantId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Valid 24-character hex Tenant ID')
    .optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordComplexity,
});
