import { create } from 'zustand';
import api from '../services/api.js';

const safeGetToken = (key) => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const safeSetToken = (key, token) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, token);
    }
  } catch {
    // Storage quota or restriction failure
  }
};

const safeRemoveToken = (key) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage deletion errors
  }
};

const initialAccessToken = safeGetToken('unisphere_access_token');

export const useAuthStore = create((set, get) => ({
  user: null,
  token: initialAccessToken,
  roles: [],
  permissions: [],
  isAuthenticated: Boolean(initialAccessToken),
  loading: false,

  setAuth: ({ user, tokens, roles = [], permissions = [] }) => {
    if (tokens?.accessToken) {
      safeSetToken('unisphere_access_token', tokens.accessToken);
    }
    if (tokens?.refreshToken) {
      safeSetToken('unisphere_refresh_token', tokens.refreshToken);
    }

    set({
      user,
      token: tokens?.accessToken || get().token,
      roles: roles.length > 0 ? roles : user?.roles || [],
      permissions: permissions.length > 0 ? permissions : user?.permissions || [],
      isAuthenticated: true,
    });
  },

  login: async ({ email, password, tenantId }) => {
    set({ loading: true });
    try {
      const payload = { email, password };
      if (tenantId) payload.tenantId = tenantId;

      const res = await api.post('/auth/login', payload);
      const { user, tokens } = res.data;

      get().setAuth({
        user,
        tokens,
        roles: user.roles || [],
        permissions: user.permissions || [],
      });

      return { success: true, user };
    } finally {
      set({ loading: false });
    }
  },

  fetchProfile: async () => {
    if (!safeGetToken('unisphere_access_token')) return null;
    try {
      const res = await api.get('/auth/me');
      const user = res.data;
      set({
        user,
        roles: user.roles || [],
        permissions: user.permissions || [],
        isAuthenticated: true,
      });
      return user;
    } catch {
      get().clearAuth();
      return null;
    }
  },

  logout: async () => {
    const refreshToken = safeGetToken('unisphere_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      get().clearAuth();
    }
  },

  hasRole: (role) => {
    const { roles } = get();
    return roles.map((r) => r.toUpperCase()).includes(role.toUpperCase());
  },

  can: (permission) => {
    const { permissions, roles } = get();
    if (roles.map((r) => r.toUpperCase()).includes('SUPER_ADMIN')) return true;
    return permissions.includes(permission);
  },

  clearAuth: () => {
    safeRemoveToken('unisphere_access_token');
    safeRemoveToken('unisphere_refresh_token');
    set({
      user: null,
      token: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
