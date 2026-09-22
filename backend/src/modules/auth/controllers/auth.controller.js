import * as authService from '../services/auth.service.js';
import { successResponse } from '../../../common/utils/response.js';

export const register = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    const result = await authService.register({
      ...req.body,
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
