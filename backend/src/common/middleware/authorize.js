import AppError from '../errors/AppError.js';

/**
 * Authorization Middleware: Checks if user possesses the required permission.
 * Super Administrators with '*' permission bypass all checks.
 * @param {string} requiredPermission - Format: 'resource:action'
 */
export const requirePermission = (requiredPermission) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required prior to authorization check.', 401, 'UNAUTHORIZED'));
    }

    const { permissions = [], roles = [] } = req.user;

    // Platform Super Admin bypass
    if (roles.includes('SUPER_ADMIN') || permissions.includes('*')) {
      return next();
    }

    if (!permissions.includes(requiredPermission)) {
      return next(
        new AppError(
          `Forbidden: You do not possess the required permission [${requiredPermission}] to perform this action.`,
          403,
          'FORBIDDEN',
          { requiredPermission }
        )
      );
    }

    next();
  };
};

/**
 * Authorization Middleware: Checks if user possesses ANY of the given permissions
 * @param {string[]} requiredPermissions
 */
export const requireAnyPermission = (requiredPermissions) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required prior to authorization check.', 401, 'UNAUTHORIZED'));
    }

    const { permissions = [], roles = [] } = req.user;

    if (roles.includes('SUPER_ADMIN') || permissions.includes('*')) {
      return next();
    }

    const hasAny = requiredPermissions.some((perm) => permissions.includes(perm));
    if (!hasAny) {
      return next(
        new AppError(
          `Forbidden: Missing at least one of required permissions: [${requiredPermissions.join(', ')}]`,
          403,
          'FORBIDDEN',
          { requiredPermissions }
        )
      );
    }

    next();
  };
};

/**
 * Authorization Middleware: Checks if user possesses a specific role code
 * @param {string} roleCode - e.g. 'UNIVERSITY_ADMIN', 'FACULTY'
 */
export const requireRole = (roleCode) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required prior to authorization check.', 401, 'UNAUTHORIZED'));
    }

    const { roles = [] } = req.user;

    if (roles.includes('SUPER_ADMIN') || roles.includes(roleCode)) {
      return next();
    }

    return next(
      new AppError(
        `Forbidden: This action requires the [${roleCode}] role.`,
        403,
        'FORBIDDEN',
        { requiredRole: roleCode }
      )
    );
  };
};

/**
 * Authorization Middleware: Checks if user has ANY of the specified roles
 * @param {string[]} roleCodes
 */
export const requireAnyRole = (roleCodes) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required prior to authorization check.', 401, 'UNAUTHORIZED'));
    }

    const { roles = [] } = req.user;

    if (roles.includes('SUPER_ADMIN') || roleCodes.some((code) => roles.includes(code))) {
      return next();
    }

    return next(
      new AppError(
        `Forbidden: This action requires one of the following roles: [${roleCodes.join(', ')}]`,
        403,
        'FORBIDDEN',
        { requiredRoles: roleCodes }
      )
    );
  };
};
