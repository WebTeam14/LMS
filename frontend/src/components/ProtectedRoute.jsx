import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore.js';
import { ShieldCheckIcon } from './common/Icons.jsx';

export const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const location = useLocation();
  const { isAuthenticated, hasRole, can, initialized, isLoading } = useAuthStore();

  if (!initialized && isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-slate-500">Restoring institutional session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your account role is insufficient to access this academic area. Required role: <strong className="text-slate-800">{requiredRole}</strong>.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheckIcon className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Permission Required</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your account lacks the specific permission: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[11px]">{requiredPermission}</code>.
          </p>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
