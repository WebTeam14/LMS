import * as authService from '../services/auth.service.js';
import { successResponse } from '../../../common/utils/response.js';

export const register = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Discard any roleCode sent by client; public registration is strictly for STUDENT (UNI-014)
    const { roleCode: _omittedRole, ...registrationData } = req.body;

    const result = await authService.register({
      ...registrationData,
      roleCode: 'STUDENT',
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 201);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.login({
      ...req.body,
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.refreshTokens({
      refreshToken: req.body.refreshToken,
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const refreshToken = req.body?.refreshToken;
    const userId = req.user?.id;

    await authService.logout({
      refreshToken,
      userId,
      ipAddress,
      userAgent,
    });

    return successResponse(res, { message: 'Logged out successfully' }, null, 200);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.forgotPassword({
      email: req.body.email,
      tenantId: req.body.tenantId,
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.resetPassword({
      token: req.body.token,
      newPassword: req.body.newPassword,
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.verifyEmail({
      token: req.body.token,
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, user, null, 200);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.changePassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
      ipAddress,
      userAgent,
    });

    return successResponse(res, result, null, 200);
  } catch (error) {
    next(error);
  }
};
