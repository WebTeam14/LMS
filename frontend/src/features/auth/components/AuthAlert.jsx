import React from 'react';
import { AlertCircleIcon, CheckCircleIcon } from '../../../components/common/Icons.jsx';

export const AuthAlert = ({ type = 'error', title, message, className = '', onClose }) => {
  if (!message) return null;

  const styles = {
    error: {
      container: 'bg-rose-50/80 border-rose-200/80 text-rose-800',
      icon: <AlertCircleIcon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />,
      titleColor: 'text-rose-900',
    },
    success: {
      container: 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800',
      icon: <CheckCircleIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />,
      titleColor: 'text-emerald-900',
    },
    warning: {
      container: 'bg-amber-50/80 border-amber-200/80 text-amber-800',
      icon: <AlertCircleIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />,
      titleColor: 'text-amber-900',
    },
    info: {
      container: 'bg-indigo-50/80 border-indigo-200/80 text-indigo-800',
      icon: <AlertCircleIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />,
      titleColor: 'text-indigo-900',
    },
  };

  const current = styles[type] || styles.error;

  return (
    <div
      className={`rounded-xl border p-3.5 text-xs text-left flex items-start gap-2.5 transition-all shadow-xs animate-fadeIn ${current.container} ${className}`}
      role="alert"
    >
      {current.icon}
      <div className="flex-1 space-y-0.5">
        {title && <p className={`font-semibold ${current.titleColor}`}>{title}</p>}
        <div className="leading-relaxed font-normal">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-0.5 rounded ml-1"
          aria-label="Dismiss alert"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AuthAlert;
