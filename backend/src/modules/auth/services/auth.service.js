import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Role from '../models/Role.js';
import UserRole from '../models/UserRole.js';
import RefreshToken from '../models/RefreshToken.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../../../common/errors/AppError.js';
import {
  generateAccessToken,
  generateRandomTokenString,
  hashToken,
} from '../../../common/utils/token.js';

/**
 * Helper to extract role codes and merged distinct permissions
 */
const getUserRolesAndPermissions = async (userId) => {
  const userRoles = await UserRole.find({ userId }).populate('roleId');
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
        for (const p of ur.roleId.permissions) {
          permissionsSet.add(p);
        }
      }
    }
  }

  return {
    roles: roles.map((r) => r.code),
    rolesDetail: roles,
    permissions: Array.from(permissionsSet),
  };
};

/**
 * Helper to issue access token and persist a new refresh token
 */
const issueTokenPair = async ({ user, tenantId, roles, permissions, ipAddress, userAgent }) => {
  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    tenantId: tenantId ? tenantId.toString() : null,
    email: user.email,
    roles,
    permissions,
  });

  const refreshTokenString = generateRandomTokenString(40);
  const tokenHash = hashToken(refreshTokenString);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await RefreshToken.create({
    userId: user._id,
    tenantId,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return {
    accessToken,
    refreshToken: refreshTokenString,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
};

export const register = async ({
  firstName,
  lastName,
  email,
  password,
  tenantId,
  roleCode = 'STUDENT',
  ipAddress,
  userAgent,
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check unique email within tenant
  const existingUser = await User.findOne({
    tenantId,
    email: normalizedEmail,
    isDeleted: false,
  });

  if (existingUser) {
    throw new AppError(
      'An account with this email address already exists in this institution.',
      409,
      'USER_ALREADY_EXISTS'
    );
  }

  // Hash password with bcrypt cost 12
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    tenantId,
    firstName,
    lastName,
    email: normalizedEmail,
    passwordHash,
    status: 'active',
  });

  // Assign requested or default role
  const role = await Role.findOne({
    code: roleCode,
    $or: [{ tenantId }, { tenantId: null }],
  });

  if (role) {
    await UserRole.create({
      userId: user._id,
      roleId: role._id,
      tenantId,
      assignedBy: user._id,
    });
  }

  const { roles, rolesDetail, permissions } = await getUserRolesAndPermissions(user._id);
  const tokens = await issueTokenPair({
    user,
    tenantId,
    roles,
    permissions,
    ipAddress,
    userAgent,
  });

  await AuditLog.create({
    tenantId,
    userId: user._id,
    action: 'REGISTER_SUCCESS',
    resource: 'User',
    resourceId: user._id.toString(),
    ipAddress,
    userAgent,
  });

  return {
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      tenantId: user.tenantId,
      status: user.status,
      roles,
      rolesDetail,
      permissions,
    },
    tokens,
  };
};

export const login = async ({ email, password, tenantId, ipAddress, userAgent }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const query = { email: normalizedEmail, isDeleted: false };
  if (tenantId) query.tenantId = tenantId;

  // Find user and explicitly select passwordHash + lockUntil + failedLoginAttempts
  const user = await User.findOne(query).select('+passwordHash +failedLoginAttempts +lockUntil');

  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Check account lockout
  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
    await AuditLog.create({
      tenantId: user.tenantId,
      userId: user._id,
      action: 'LOGIN_LOCKED',
      status: 'FAILURE',
      ipAddress,
      userAgent,
      metadata: { lockUntil: user.lockUntil, minutesLeft },
    });
    throw new AppError(
      `Account is temporarily locked due to excessive failed attempts. Please try again in ${minutesLeft} minute(s).`,
      423,
      'ACCOUNT_LOCKED',
      { minutesLeft, lockUntil: user.lockUntil }
    );
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    await AuditLog.create({
      tenantId: user.tenantId,
      userId: user._id,
      action: 'LOGIN_FAILED',
      status: 'FAILURE',
      ipAddress,
      userAgent,
    });
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // Account status check
  if (user.status === 'suspended') {
    throw new AppError('Your account has been suspended. Please contact administrator.', 403, 'ACCOUNT_SUSPENDED');
  }
  if (user.status === 'inactive') {
    throw new AppError('Your account is currently inactive.', 403, 'ACCOUNT_INACTIVE');
  }

  // Reset login attempts on success
  await user.resetLoginAttempts(ipAddress);

  const { roles, rolesDetail, permissions } = await getUserRolesAndPermissions(user._id);
  const tokens = await issueTokenPair({
    user,
    tenantId: user.tenantId,
    roles,
    permissions,
    ipAddress,
    userAgent,
  });

  await AuditLog.create({
    tenantId: user.tenantId,
    userId: user._id,
    action: 'LOGIN_SUCCESS',
    status: 'SUCCESS',
    ipAddress,
    userAgent,
  });

  return {
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      tenantId: user.tenantId,
      status: user.status,
      roles,
      rolesDetail,
      permissions,
    },
    tokens,
  };
};

export const refreshTokens = async ({ refreshToken, ipAddress, userAgent }) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required.', 400, 'TOKEN_REQUIRED');
  }

  const tokenHash = hashToken(refreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    throw new AppError('Invalid or unrecognized refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Check for Token Reuse (Hijack detection)
  if (tokenDoc.isRevoked) {
    // Revoke all tokens for this compromised user
    await RefreshToken.updateMany(
      { userId: tokenDoc.userId },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );

    await AuditLog.create({
      tenantId: tokenDoc.tenantId,
      userId: tokenDoc.userId,
      action: 'TOKEN_REUSE_DETECTED',
      status: 'FAILURE',
      ipAddress,
      userAgent,
      metadata: { compromisedTokenId: tokenDoc._id },
    });

    throw new AppError(
      'Security Alert: Compromised refresh token reuse detected. All sessions terminated.',
      401,
      'TOKEN_REUSE_DETECTED'
    );
  }

  // Check expiry
  if (tokenDoc.expiresAt < new Date()) {
    throw new AppError('Refresh token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');
  }

  // Verify user still exists and active
  const user = await User.findById(tokenDoc.userId);
  if (!user || user.isDeleted || user.status !== 'active') {
    throw new AppError('User session is no longer active.', 401, 'USER_INACTIVE');
  }

  // Generate replacement token
  const newRefreshTokenString = generateRandomTokenString(40);
  const newTokenHash = hashToken(newRefreshTokenString);

  // Revoke previous token and set pointer
  tokenDoc.isRevoked = true;
  tokenDoc.revokedAt = new Date();
  tokenDoc.replacedByTokenHash = newTokenHash;
  await tokenDoc.save();

  // Create new active RefreshToken
  await RefreshToken.create({
    userId: user._id,
    tenantId: tokenDoc.tenantId,
    tokenHash: newTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ipAddress,
    userAgent,
  });

  const { roles, permissions } = await getUserRolesAndPermissions(user._id);

  const accessToken = generateAccessToken({
    sub: user._id.toString(),
    tenantId: tokenDoc.tenantId ? tokenDoc.tenantId.toString() : null,
    email: user.email,
    roles,
    permissions,
  });

  return {
    accessToken,
    refreshToken: newRefreshTokenString,
    expiresIn: 15 * 60,
  };
};

export const logout = async ({ refreshToken, userId, ipAddress, userAgent }) => {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await RefreshToken.updateOne(
      { tokenHash },
      { $set: { isRevoked: true, revokedAt: new Date() } }
    );
  }

  if (userId) {
    await AuditLog.create({
      userId,
      action: 'LOGOUT',
      status: 'SUCCESS',
      ipAddress,
      userAgent,
    });
  }

  return { success: true };
};

export const changePassword = async ({ userId, currentPassword, newPassword, ipAddress, userAgent }) => {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || user.isDeleted) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 400, 'INVALID_CURRENT_PASSWORD');
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  user.passwordHash = newHash;
  user.passwordChangedAt = new Date();
  await user.save();

  // Revoke all existing refresh tokens (forces re-login across devices)
  await RefreshToken.updateMany(
    { userId: user._id, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );

  await AuditLog.create({
    tenantId: user.tenantId,
    userId: user._id,
    action: 'PASSWORD_CHANGE',
    status: 'SUCCESS',
    ipAddress,
    userAgent,
  });

  return { success: true, message: 'Password changed successfully. All sessions revoked.' };
};

export const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError('User profile not found.', 404, 'USER_NOT_FOUND');
  }

  const { roles, rolesDetail, permissions } = await getUserRolesAndPermissions(user._id);

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    tenantId: user.tenantId,
    status: user.status,
    emailVerified: user.emailVerified,
    lastLoginAt: user.lastLoginAt,
    roles,
    rolesDetail,
    permissions,
  };
};
