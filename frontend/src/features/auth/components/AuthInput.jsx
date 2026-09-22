import React, { useState, forwardRef } from 'react';
import { EyeIcon, EyeOffIcon } from '../../../components/common/Icons.jsx';

export const AuthInput = forwardRef(
  (
    {
      label,
      error,
      icon: Icon,
      rightAction,
      type = 'text',
      className = '',
      id,
      helperText,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9);

    return (
      <div className="space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 tracking-tight">
              {label}
            </label>
            {rightAction}
          </div>
        )}

        <div
          className={`relative flex items-center rounded-lg bg-white border auth-input-transition shadow-sm ${
            error
              ? 'border-rose-300 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10'
              : 'border-slate-200 hover:border-slate-300 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-600/10'
          }`}
        >
          {Icon && (
            <div className="pl-3.5 pr-1 text-slate-400 pointer-events-none flex items-center">
              <Icon className="w-4 h-4" />
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            type={computedType}
            className={`w-full bg-transparent px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              Icon ? 'pl-2' : 'pl-3.5'
            } ${isPassword ? 'pr-10' : 'pr-3.5'} ${className}`}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 rounded transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          )}
        </div>

        {helperText && !error && (
          <p className="text-[11px] text-slate-400 leading-normal pl-0.5">{helperText}</p>
        )}

        {error && (
          <p className="text-xs font-medium text-rose-600 flex items-center gap-1 pl-0.5 pt-0.5 animate-fadeIn">
            <span>&bull;</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';

export default AuthInput;
