import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '../schemas/authSchemas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { AuthInput } from '../components/AuthInput.jsx';
import { AuthButton } from '../components/AuthButton.jsx';
import { AuthAlert } from '../components/AuthAlert.jsx';
import { MailIcon, BuildingIcon, ArrowLeftIcon, ArrowRightIcon } from '../../../components/common/Icons.jsx';
import authService from '../services/authService.js';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const defaultTenantId = import.meta.env.VITE_DEFAULT_TENANT_ID || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      tenantId: defaultTenantId,
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError(null);
    setSuccessInfo(null);
    try {
      const data = await authService.forgotPassword({
        email: values.email,
        tenantId: values.tenantId?.trim() || undefined,
      });
      setSuccessInfo(data);
    } catch (err) {
      setServerError(err.message || 'Unable to process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your institutional email and we will send you secure recovery instructions."
      badgeText="Account Recovery"
    >
      {successInfo ? (
        <div className="space-y-4 text-left">
          <AuthAlert
            type="success"
            title="Recovery Instructions Dispatched"
            message={successInfo.message || 'If an account exists, password recovery instructions have been dispatched.'}
          />

          {/* If backend returns a reset token in development, allow direct transition */}
          {successInfo.resetToken && (
            <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-indigo-900">Direct Test Token:</span>
                <span className="text-[10px] text-indigo-600 font-mono">Dev / Sandbox Mode</span>
              </div>
              <p className="font-mono text-[11px] text-slate-700 break-all bg-white p-2 rounded border border-indigo-100 select-all">
                {successInfo.resetToken}
              </p>
              <Link
                to={`/reset-password?token=${encodeURIComponent(successInfo.resetToken)}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline pt-1"
              >
                <span>Proceed to Set New Password</span>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="pt-2">
            <Link to="/login" className="block w-full">
              <AuthButton variant="secondary" icon={ArrowLeftIcon}>
                Return to Login
              </AuthButton>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {serverError && <AuthAlert type="error" message={serverError} />}

          <AuthInput
            label="Institutional Email"
            type="email"
            placeholder="username@university.edu"
            icon={MailIcon}
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthInput
            label="Institution / Tenant ID (Optional)"
            placeholder="e.g. 650000000000000000000001"
            icon={BuildingIcon}
            helperText="Specify if your email is registered across multiple campuses"
            error={errors.tenantId?.message}
            {...register('tenantId')}
          />

          <div className="pt-2">
            <AuthButton type="submit" loading={loading}>
              Send Recovery Instructions
            </AuthButton>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
