import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('unisphere_access_token') || null,
  isAuthenticated: Boolean(localStorage.getItem('unisphere_access_token')),
  setAuth: (user, token) => {
    localStorage.setItem('unisphere_access_token', token);
    set({ user, token, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.removeItem('unisphere_access_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
