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

  /**
   * Change user password
   */
  async changePassword({ currentPassword, newPassword }) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // ==========================================
  // MFA (TWO-FACTOR AUTHENTICATION)
  // ==========================================

  /**
   * Initiate MFA setup (generates secret, QR code data URL, backup codes)
   */
  async setupMfa() {
    const response = await api.post('/auth/mfa/setup');
    return response.data; // { secret, qrCodeUrl, backupCodes }
  },

  /**
   * Complete MFA enablement with 6-digit TOTP code
   */
  async enableMfa(code) {
    const response = await api.post('/auth/mfa/enable', { code });
    return response.data;
  },

  /**
   * Disable MFA with password or TOTP code
   */
  async disableMfa({ password, code }) {
    const response = await api.post('/auth/mfa/disable', { password, code });
    return response.data;
  },

  /**
   * Verify MFA challenge during login step 2
   */
  async verifyMfa({ mfaToken, code }) {
    const response = await api.post('/auth/mfa/verify', { mfaToken, code });
    return response.data; // { user, tokens }
  },

  // ==========================================
  // ACTIVE SESSIONS & DEVICES
  // ==========================================

  /**
   * List all active sessions and devices
   */
  async getSessions() {
    const refreshToken = localStorage.getItem('unisphere_refresh_token');
    const response = await api.get('/auth/sessions', {
      headers: refreshToken ? { 'x-refresh-token': refreshToken } : {},
    });
    return response.data; // Array of session objects
  },

  /**
   * Terminate a specific session by ID
   */
  async revokeSession(sessionId) {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Terminate all other sessions except current
   */
  async revokeOtherSessions() {
    const refreshToken = localStorage.getItem('unisphere_refresh_token');
    const response = await api.delete('/auth/sessions', {
      data: { refreshToken },
    });
    return response.data;
  },
};

export default authService;
