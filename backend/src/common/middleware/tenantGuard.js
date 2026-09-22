import AppError from '../errors/AppError.js';

/**
 * Multi-Tenancy Guard Middleware:
 * Enforces strict university/tenant boundary isolation on every incoming request.
 * Injects tenant-scoping query helpers into the request.
 */
export const tenantGuard = (req, _res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required for tenant isolation verification.', 401, 'UNAUTHORIZED'));
  }

  const isSuperAdmin = req.user.roles.includes('SUPER_ADMIN');

  // Verify any explicit tenant parameter against the authenticated user's tenant
  const explicitTenantId = req.params.tenantId || req.query.tenantId || req.body?.tenantId;

  if (explicitTenantId && !isSuperAdmin) {
    if (explicitTenantId.toString() !== req.user.tenantId?.toString()) {
      return next(
        new AppError(
          'Security Violation: Cross-tenant access is strictly prohibited.',
          403,
          'CROSS_TENANT_ACCESS_DENIED'
        )
      );
    }
  }

  // Provide query-builder helper to guarantee tenant-scoped queries
  req.getTenantFilter = (baseFilter = {}) => {
    if (isSuperAdmin && !explicitTenantId) {
      return { isDeleted: false, ...baseFilter };
    }
    return {
      ...baseFilter,
      tenantId: req.user.tenantId,
      isDeleted: false,
    };
  };

  next();
};

export default tenantGuard;
