import useAuthStore from '../../../stores/useAuthStore.js';

/**
 * Custom hook providing structured access to auth store with role-based routing helpers
 */
export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialized = useAuthStore((state) => state.initialized);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const hasRole = useAuthStore((state) => state.hasRole);
  const can = useAuthStore((state) => state.can);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  /**
   * Determine primary landing path based on highest privilege role
   */
  const getRoleRedirectPath = () => {
    if (!roles || roles.length === 0) return '/dashboard';
    const normalized = roles.map((r) => r.toUpperCase());
    if (normalized.includes('SUPER_ADMIN')) return '/dashboard';
    if (normalized.includes('UNIVERSITY_ADMIN')) return '/dashboard';
    if (normalized.includes('FACULTY')) return '/dashboard';
    if (normalized.includes('EXAMINATION_OFFICER')) return '/dashboard';
    return '/dashboard'; // Default student dashboard
  };

  return {
    user,
    accessToken,
    refreshToken,
    roles,
    permissions,
    isAuthenticated,
    isLoading,
    initialized,
    login,
    register,
    logout,
    hasRole,
    can,
    initializeAuth,
    getRoleRedirectPath,
  };
};

export default useAuth;
