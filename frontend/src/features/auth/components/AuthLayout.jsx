import React from 'react';
import { UniSphereLogo } from '../../../components/common/Icons.jsx';

export const AuthLayout = ({
  children,
  title,
  subtitle,
  badgeText = 'Institutional Digital Campus',
}) => {
  return (
    <div className="min-h-screen bg-slate-50 bg-subtle-grid bg-ambient-glow flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Brand Header */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center space-x-2">
          <UniSphereLogo className="w-7 h-7" />
          <span className="font-bold tracking-tight text-slate-900 text-sm">UniSphere</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-slate-200/60 border border-slate-300/60 px-2.5 py-0.5 rounded-full font-medium text-[11px] text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>v1.0 Production</span>
        </div>
      </header>

      {/* Main Floating Card */}
      <main className="my-auto sm:mx-auto sm:w-full sm:max-w-[440px]">
        <div className="auth-card rounded-2xl p-7 sm:p-9 shadow-sm">
          {/* Badge & Title */}
          <div className="mb-6 text-center">
            {badgeText && (
              <span className="inline-block text-[11px] font-semibold tracking-wider uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full mb-2.5">
                {badgeText}
              </span>
            )}
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center mt-6 pt-4 border-t border-slate-200/60 text-[11px] text-slate-400 space-y-1">
        <p>UniSphere Digital Campus Platform &bull; Phase 2 Security Architecture</p>
        <p>End-to-End Cryptographic Tokens &bull; Multi-Tenant Boundary Isolation</p>
      </footer>
    </div>
  );
};

export default AuthLayout;
