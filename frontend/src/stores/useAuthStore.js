import { create } from 'zustand';
import authService from '../features/auth/services/authService.js';

const safeGetItem = (key) => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const safeSetItem = (key, val) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, val);
    }
  } catch {
    // Storage quota or restriction failure
  }
};

const safeRemoveItem = (key) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage deletion error
  }
};

const initialAccessToken = safeGetItem('unisphere_access_token');
const initialRefreshToken = safeGetItem('unisphere_refresh_token');

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: initialAccessToken,
  refreshToken: initialRefreshToken,
  roles: [],
  permissions: [],
  isAuthenticated: Boolean(initialAccessToken),
  isLoading: false,
  initialized: false,

  setAuth: ({ user, tokens, roles = [], permissions = [] }) => {
    const accToken = tokens?.accessToken || get().accessToken;
    const refToken = tokens?.refreshToken || get().refreshToken;

    if (tokens?.accessToken) safeSetItem('unisphere_access_token', tokens.accessToken);
    if (tokens?.refreshToken) safeSetItem('unisphere_refresh_token', tokens.refreshToken);

    const userRoles = roles.length > 0 ? roles : user?.roles || [];
    const userPermissions = permissions.length > 0 ? permissions : user?.permissions || [];

    set({
      user,
      accessToken: accToken,
      refreshToken: refToken,
      roles: userRoles,
      permissions: userPermissions,
      isAuthenticated: Boolean(accToken),
    });
  },

  setUser: (user) => {
    set({
      user,
      roles: user?.roles || get().roles,
      permissions: user?.permissions || get().permissions,
    });
  },

  login: async ({ email, password, tenantId }) => {
    set({ isLoading: true });
    try {
      const data = await authService.login({ email, password, tenantId });
      if (data?.mfaRequired) {
        return { mfaRequired: true, mfaToken: data.mfaToken, email: data.email };
      }
      get().setAuth({
        user: data.user,
        tokens: data.tokens,
        roles: data.user.roles || [],
        permissions: data.user.permissions || [],
      });
      return { success: true, user: data.user };
    } finally {
      set({ isLoading: false });
    }
  },

  verifyMfaLogin: async ({ mfaToken, code }) => {
    set({ isLoading: true });
    try {
      const { user, tokens } = await authService.verifyMfa({ mfaToken, code });
      get().setAuth({
        user,
        tokens,
        roles: user.roles || [],
        permissions: user.permissions || [],
      });
      return { success: true, user };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ firstName, lastName, email, password, tenantId }) => {
    set({ isLoading: true });
    try {
      const { user, tokens, verificationToken } = await authService.register({
        firstName,
        lastName,
        email,
        password,
        tenantId,
      });
      get().setAuth({
        user,
        tokens,
        roles: user.roles || [],
        permissions: user.permissions || [],
      });
      return { success: true, user, verificationToken };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const refToken = get().refreshToken || safeGetItem('unisphere_refresh_token');
    try {
      await authService.logout(refToken);
    } catch {
      // Ignore network errors during logout
    } finally {
      get().clearAuth();
    }
  },

  clearAuth: () => {
    safeRemoveItem('unisphere_access_token');
    safeRemoveItem('unisphere_refresh_token');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
    });
  },

  hasRole: (role) => {
    const { roles } = get();
    if (!role) return true;
    return roles.some((r) => r.toUpperCase() === role.toUpperCase());
  },

  can: (permission) => {
    const { permissions, roles } = get();
    if (!permission) return true;
    if (roles.some((r) => r.toUpperCase() === 'SUPER_ADMIN')) return true;
    if (permissions.includes('*')) return true;
    return permissions.includes(permission);
  },

  initializeAuth: async () => {
    const storedAccessToken = safeGetItem('unisphere_access_token');
    const storedRefreshToken = safeGetItem('unisphere_refresh_token');

    if (!storedAccessToken && !storedRefreshToken) {
      set({ initialized: true, isLoading: false, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await authService.getMe();
      set({
        user,
        accessToken: storedAccessToken,
        refreshToken: storedRefreshToken,
        roles: user.roles || [],
        permissions: user.permissions || [],
        isAuthenticated: true,
        initialized: true,
        isLoading: false,
      });
    } catch {
      get().clearAuth();
      set({ initialized: true, isLoading: false });
    }
  },
}));

export default useAuthStore;
