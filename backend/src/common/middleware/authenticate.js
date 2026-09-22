import { verifyAccessToken } from '../utils/token.js';
import AppError from '../errors/AppError.js';
import User from '../../modules/auth/models/User.js';
import UserRole from '../../modules/auth/models/UserRole.js';

/**
 * Authentication Middleware:
 * Validates JWT access token, checks account status, and populates req.user with roles & permissions
 */
export const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Access token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED'));
      }
      return next(new AppError('Invalid access token.', 401, 'INVALID_TOKEN'));
    }

    if (!decoded || !decoded.sub) {
      return next(new AppError('Malformed token payload.', 401, 'INVALID_TOKEN'));
    }

    // Load active user
    const user = await User.findById(decoded.sub);
    if (!user || user.isDeleted) {
      return next(new AppError('User account not found or has been removed.', 401, 'USER_NOT_FOUND'));
    }

    if (user.status === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact administration.', 403, 'ACCOUNT_SUSPENDED'));
    }

    if (user.status === 'inactive') {
      return next(new AppError('Your account is inactive.', 403, 'ACCOUNT_INACTIVE'));
    }

    // Load assigned user roles
    const userRoles = await UserRole.find({ userId: user._id }).populate('roleId');
    const roles = [];
    const permissionsSet = new Set();

    for (const ur of userRoles) {
      if (ur.roleId) {
        roles.push({
          code: ur.roleId.code,
          name: ur.roleId.name,
          scope: ur.scope,
        });

        if (Array.isArray(ur.roleId.permissions)) {
          for (const perm of ur.roleId.permissions) {
            permissionsSet.add(perm);
          }
        }
      }
    }

    // Attach user profile & security context to request
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      tenantId: user.tenantId ? user.tenantId.toString() : null,
      status: user.status,
      roles: roles.map((r) => r.code),
      rolesDetail: roles,
      permissions: Array.from(permissionsSet),
    };

    req.tenantId = req.user.tenantId;

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
