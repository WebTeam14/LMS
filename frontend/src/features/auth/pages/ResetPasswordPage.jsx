import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordSchema } from '../schemas/authSchemas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { AuthInput } from '../components/AuthInput.jsx';
import { AuthButton } from '../components/AuthButton.jsx';
import { AuthAlert } from '../components/AuthAlert.jsx';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.jsx';
import { LockIcon, ShieldCheckIcon, ArrowLeftIcon } from '../../../components/common/Icons.jsx';
import authService from '../services/authService.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlToken = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: urlToken,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const currentPassword = watch('newPassword');

  const onSubmit = async (values) => {
    setLoading(true);
    setServerError(null);
    try {
      await authService.resetPassword({
        token: values.token.trim(),
        newPassword: values.newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { message: 'Password reset successfully. Please log in with your new credentials.' },
        });
      }, 2000);
    } catch (err) {
      setServerError(err.message || 'Unable to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a strong, high-entropy password for your digital campus account."
      badgeText="Credential Update"
    >
      {success ? (
        <div className="space-y-4 text-left">
          <AuthAlert
            type="success"
            title="Password Updated"
            message="Your password has been changed successfully. All previous sessions have been revoked. Redirecting to login..."
          />
          <Link to="/login" className="block w-full">
            <AuthButton variant="primary">Proceed to Login Now</AuthButton>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {serverError && <AuthAlert type="error" message={serverError} />}

          <AuthInput
            label="Recovery Token"
            placeholder="32-character hexadecimal token"
            icon={ShieldCheckIcon}
            helperText={urlToken ? 'Token automatically loaded from recovery link' : 'Paste the token received in your email'}
            error={errors.token?.message}
            {...register('token')}
          />

          <AuthInput
            label="New Password"
            type="password"
            placeholder="••••••••"
            icon={LockIcon}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />

          <PasswordStrengthMeter password={currentPassword} />

          <AuthInput
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            icon={LockIcon}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />

          <div className="pt-2">
            <AuthButton type="submit" loading={loading}>
              Update Password & Revoke Sessions
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
