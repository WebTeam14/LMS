import api from '../../../services/api.js';

/**
 * Auth API Service - Calls real backend endpoints at /api/v1/auth/*
 */
export const authService = {
  /**
   * Authenticate user with email, password, and optional tenantId
   */
  async login({ email, password, tenantId }) {
    const payload = { email, password };
    if (tenantId) payload.tenantId = tenantId;
    const response = await api.post('/auth/login', payload);
    return response.data; // { user, tokens: { accessToken, refreshToken } }
  },

  /**
   * Public registration - backend strictly assigns STUDENT role (UNI-014)
   */
  async register({ firstName, lastName, email, password, tenantId }) {
    const response = await api.post('/auth/register', {
      firstName,
      lastName,
      email,
      password,
      tenantId,
    });
    return response.data; // { user, tokens, verificationToken }
  },

  /**
   * Request password reset link/token
   */
  async forgotPassword({ email, tenantId }) {
    const payload = { email };
    if (tenantId) payload.tenantId = tenantId;
    const response = await api.post('/auth/forgot-password', payload);
    return response.data; // { message, resetToken }
  },

  /**
   * Complete password reset using cryptographic token
   */
  async resetPassword({ token, newPassword }) {
    const response = await api.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data; // { success, message }
  },

  /**
   * Verify institutional email address
   */
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', { token });
    return response.data; // { success, message }
  },

  /**
   * Terminate active session and revoke refresh token
   */
  async logout(refreshToken) {
    const payload = refreshToken ? { refreshToken } : {};
    const response = await api.post('/auth/logout', payload);
    return response.data;
  },

  /**
   * Retrieve authenticated user profile and merged permissions
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data; // User profile with roles and permissions
  },

  /**
   * Rotate refresh token and get fresh access token
   */
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    return response.data; // { accessToken, refreshToken, expiresIn }
  },
};

export default authService;
