import { create } from 'zustand';

const safeGetToken = () => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('unisphere_access_token') : null;
  } catch {
    return null;
  }
};

const safeSetToken = (token) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unisphere_access_token', token);
    }
  } catch {
    // Storage quota or restriction failure
  }
};

const safeRemoveToken = () => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('unisphere_access_token');
    }
  } catch {
    // Ignore storage deletion errors
  }
};

const initialToken = safeGetToken();

export const useAuthStore = create((set, get) => ({
  user: null,
  token: initialToken,
  roles: [],
  permissions: [],
  isAuthenticated: Boolean(initialToken),

  setAuth: ({ user, token, roles = [], permissions = [] }) => {
    safeSetToken(token);
    set({
      user,
      token,
      roles,
      permissions,
      isAuthenticated: true,
    });
  },

  hasPermission: (permission) => {
    const { permissions, roles } = get();
    if (roles.includes('super_admin')) return true;
    return permissions.includes(permission);
  },

  clearAuth: () => {
    safeRemoveToken();
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
