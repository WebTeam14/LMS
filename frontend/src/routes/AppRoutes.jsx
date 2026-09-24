import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore.js';
import ProtectedRoute from '../components/ProtectedRoute.jsx';

import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage.jsx';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage.jsx';
import SecuritySettingsPage from '../features/auth/pages/SecuritySettingsPage.jsx';
import DashboardPage from '../features/dashboard/DashboardPage.jsx';

/**
 * PublicRoute: Redirects already-authenticated users to /dashboard
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, initialized, isLoading } = useAuthStore();

  if (!initialized && isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/verify-email"
        element={<VerifyEmailPage />}
      />

      {/* Protected Academic Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <ProtectedRoute>
            <SecuritySettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 Fallback */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center font-sans">
            <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 space-y-4 shadow-sm">
              <span className="text-3xl font-bold text-slate-800">404</span>
              <h1 className="text-base font-semibold text-slate-900">Page Not Found</h1>
              <p className="text-xs text-slate-500">
                The requested campus path does not exist or has been relocated.
              </p>
              <a
                href="/dashboard"
                className="inline-block px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Return to Campus
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
