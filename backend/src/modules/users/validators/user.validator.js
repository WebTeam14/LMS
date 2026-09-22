import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
  email: z.string().trim().email('Valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[0-9]/, 'Password must contain number'),
  roleCode: z.string().trim().toUpperCase().optional().default('STUDENT'),
  phone: z.string().trim().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(50).optional(),
  lastName: z.string().trim().min(1).max(50).optional(),
  phone: z.string().trim().optional(),
  avatarUrl: z.string().url().optional(),
  status: z.enum(['active', 'invited', 'suspended', 'inactive']).optional(),
});

export const assignRoleSchema = z.object({
  roleCode: z.string().trim().toUpperCase().min(1, 'Role code is required'),
  scope: z
    .object({
      universityId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
      campusId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
      schoolId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
      departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
      programId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional().nullable(),
    })
    .optional(),
});
