import React from 'react';
import { SpinnerIcon } from '../../../components/common/Icons.jsx';

export const AuthButton = ({
  children,
  loading = false,
  disabled = false,
  variant = 'primary',
  type = 'submit',
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseStyles =
    'w-full font-semibold text-sm py-2.5 px-4 rounded-lg transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.99]';

  const variants = {
    primary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-sm hover:shadow focus:ring-slate-950/15',
    indigo:
      'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow focus:ring-indigo-600/20',
    secondary:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm hover:border-slate-300 focus:ring-slate-200',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-200',
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <SpinnerIcon className="w-4 h-4 text-current" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default AuthButton;
