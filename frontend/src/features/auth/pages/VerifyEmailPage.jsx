import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { verifyEmailSchema } from '../schemas/authSchemas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { AuthInput } from '../components/AuthInput.jsx';
import { AuthButton } from '../components/AuthButton.jsx';
import { AuthAlert } from '../components/AuthAlert.jsx';
import { ShieldCheckIcon, CheckCircleIcon, ArrowLeftIcon, SpinnerIcon } from '../../../components/common/Icons.jsx';
import authService from '../services/authService.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token') || '';

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [verified, setVerified] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      token: urlToken,
    },
  });

  const performVerification = async (tokenToVerify) => {
    setLoading(true);
    setServerError(null);
    try {
      await authService.verifyEmail(tokenToVerify.trim());
      setVerified(true);
    } catch (err) {
      setServerError(err.message || 'Email verification failed or token has expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlToken && !autoTriggered) {
      setAutoTriggered(true);
      setValue('token', urlToken);
      performVerification(urlToken);
    }
  }, [urlToken]);

  const onSubmit = (values) => {
    performVerification(values.token);
  };

  return (
    <AuthLayout
      title="Verify Institutional Email"
      subtitle="Confirm ownership of your university email to activate all digital campus privileges."
      badgeText="Identity Verification"
    >
      {verified ? (
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircleIcon className="w-6 h-6" />
          </div>

          <AuthAlert
            type="success"
            title="Email Verified Successfully"
            message="Your institutional email is now verified. Your student account is fully active."
          />

          <Link to="/dashboard" className="block w-full pt-2">
            <AuthButton variant="primary">Proceed to Dashboard</AuthButton>
          </Link>
        </div>
      ) : loading ? (
        <div className="py-8 space-y-3 text-center">
          <SpinnerIcon className="w-8 h-8 text-indigo-600 mx-auto" />
          <p className="text-sm font-medium text-slate-700">Verifying your institutional token...</p>
          <p className="text-xs text-slate-400">Communicating with university cryptographic directory</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          {serverError && <AuthAlert type="error" message={serverError} />}

          <AuthInput
            label="Verification Token"
            placeholder="Paste your 32-character verification token"
            icon={ShieldCheckIcon}
            helperText="Check your university inbox for the verification token"
            error={errors.token?.message}
            {...register('token')}
          />

          <div className="pt-2">
            <AuthButton type="submit" loading={loading}>
              Verify Institutional Email
            </AuthButton>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              <span>Continue to Campus Dashboard</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
