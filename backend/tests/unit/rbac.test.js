import { jest } from '@jest/globals';
import {
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireAnyRole,
} from '../../src/common/middleware/authorize.js';

describe('RBAC Authorization Middleware (Unit Tests)', () => {
  const createMockReq = (roles = [], permissions = []) => ({
    user: {
      id: '507f1f77bcf86cd799439011',
      roles,
      permissions,
    },
  });

  describe('requirePermission', () => {
    it('calls next() when user has the exact required permission', () => {
      const req = createMockReq(['FACULTY'], ['courses:read', 'courses:manage']);
      const next = jest.fn();

      const middleware = requirePermission('courses:manage');
      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('bypasses check when user has SUPER_ADMIN role', () => {
      const req = createMockReq(['SUPER_ADMIN'], []);
      const next = jest.fn();

      const middleware = requirePermission('any:protected:permission');
      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('bypasses check when user has wildcard "*" permission', () => {
      const req = createMockReq(['ADMIN'], ['*']);
      const next = jest.fn();

      const middleware = requirePermission('any:protected:permission');
      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('passes AppError(403) to next() when user lacks permission', () => {
      const req = createMockReq(['STUDENT'], ['courses:read']);
      const next = jest.fn();

      const middleware = requirePermission('courses:delete');
      middleware(req, {}, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeDefined();
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe('FORBIDDEN');
    });
  });

  describe('requireAnyPermission', () => {
    it('calls next() when user has at least one of the permissions', () => {
      const req = createMockReq(['FACULTY'], ['practicals:read']);
      const next = jest.fn();

      const middleware = requireAnyPermission(['practicals:create', 'practicals:read']);
      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('passes AppError(403) when user lacks all required permissions', () => {
      const req = createMockReq(['STUDENT'], ['courses:read']);
      const next = jest.fn();

      const middleware = requireAnyPermission(['exams:publish', 'grades:publish']);
      middleware(req, {}, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });
  });

  describe('requireRole', () => {
    it('calls next() when user has the required role', () => {
      const req = createMockReq(['UNIVERSITY_ADMIN']);
      const next = jest.fn();

      const middleware = requireRole('UNIVERSITY_ADMIN');
      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('passes AppError(403) when user lacks the required role', () => {
      const req = createMockReq(['STUDENT']);
      const next = jest.fn();

      const middleware = requireRole('FACULTY');
      middleware(req, {}, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });
  });

  describe('requireAnyRole', () => {
    it('calls next() when user matches one of the allowed roles', () => {
      const req = createMockReq(['FACULTY']);
      const next = jest.fn();

      const middleware = requireAnyRole(['UNIVERSITY_ADMIN', 'DEAN', 'FACULTY']);
      middleware(req, {}, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('passes AppError(403) when user role matches none', () => {
      const req = createMockReq(['PARENT']);
      const next = jest.fn();

      const middleware = requireAnyRole(['UNIVERSITY_ADMIN', 'FACULTY']);
      middleware(req, {}, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err.statusCode).toBe(403);
    });
  });
});
