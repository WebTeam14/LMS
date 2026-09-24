import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema } from '../schemas/authSchemas.js';
import { BrandMark } from '../components/BrandMark.jsx';
import campusImage from '../../../assets/unisphere-campus.jpg';
import {
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  Building2Icon,
  ShieldCheckIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  BookOpenIcon,
  SpinnerIcon,
  KeyIcon,
  ArrowLeftIcon,
} from '../../../components/common/Icons.jsx';
import useAuthStore from '../../../stores/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMfaLogin, isLoading } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showInstitution, setShowInstitution] = useState(false);
  const [tenantCandidates, setTenantCandidates] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // MFA Challenge State
  const [mfaChallenge, setMfaChallenge] = useState(null); // { mfaToken, email }
  const [mfaCode, setMfaCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);

  const defaultTenantId = import.meta.env.VITE_DEFAULT_TENANT_ID || '';
  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      tenantId: defaultTenantId,
    },
  });

  const selectedTenant = watch('tenantId');

  const onSubmit = async (values) => {
    setServerError(null);
    setSuccessMessage(null);
    setTenantCandidates([]);

    try {
      const res = await login({
        email: values.email,
        password: values.password,
        tenantId: values.tenantId?.trim() || undefined,
      });

      if (res?.mfaRequired) {
        setMfaChallenge({ mfaToken: res.mfaToken, email: res.email || values.email });
        setServerError(null);
        return;
      }

      setSuccessMessage('Signed in successfully. Opening your workspace…');
      window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 350);
    } catch (err) {
      if (err.code === 'TENANT_REQUIRED' && err.details?.tenantIds?.length) {
        setTenantCandidates(err.details.tenantIds);
        setShowInstitution(true);
        setServerError(
          'Your email belongs to more than one institution. Choose the correct campus to continue.'
        );
      } else if (
        err.status === 500 ||
        err.message?.includes('500') ||
        err.message?.includes('buffering timed out')
      ) {
        setServerError(
          'Database connection timed out. Please ensure Docker Desktop and MongoDB are running.'
        );
      } else {
        setServerError(err.message || 'Authentication failed. Please verify credentials.');
      }
    }
  };

  const onMfaSubmit = async (e) => {
    e.preventDefault();
    if (!mfaCode.trim()) {
      setServerError(
        isBackupCode
          ? 'Please enter an 8-character backup code.'
          : 'Please enter the 6-digit authenticator code.'
      );
      return;
    }

    setServerError(null);
    setSuccessMessage(null);

    try {
      await verifyMfaLogin({
        mfaToken: mfaChallenge.mfaToken,
        code: mfaCode.trim(),
      });

      setSuccessMessage('Two-factor verification confirmed. Opening your workspace…');
      window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 350);
    } catch (err) {
      setServerError(err.message || 'Invalid two-factor code. Please check and try again.');
    }
  };

  const fillSuperAdmin = () => {
    setValue('email', 'superadmin@unisphere.edu');
    setValue('password', 'SuperAdmin2026!');
    setValue('tenantId', defaultTenantId || '650000000000000000000001');
    setServerError(null);
  };

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      {/* ───────── Left Hero (Desktop only) ───────── */}
      <section
        className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between"
        aria-label="UniSphere digital campus"
      >
        <img
          src={campusImage}
          alt="Students walking through a modern university learning commons at dusk"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/20 to-slate-950/90" />

        <header className="relative z-10 p-10 xl:p-14">
          <BrandMark />
        </header>

        <div className="relative z-10 max-w-xl p-10 xl:p-14">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">
            <span className="h-px w-10 bg-teal-400/80" />
            One campus. Every possibility.
          </div>

          <h2 className="font-display text-[2.75rem] font-medium leading-[1.08] tracking-tight text-white xl:text-5xl">
            Your academic world,
            <br />
            thoughtfully connected.
          </h2>

          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-200/90">
            Learn, collaborate, and stay connected to your university community—all from one secure
            workspace.
          </p>

          <div className="mt-10 flex max-w-md items-center gap-8 border-t border-white/15 pt-6 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4 text-teal-400" /> Courses
            </span>
            <span className="flex items-center gap-2">
              <Building2Icon className="h-4 w-4 text-teal-400" /> Campus
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="h-4 w-4 text-teal-400" /> Secure
            </span>
          </div>
        </div>
      </section>

      {/* ───────── Right Form Panel ───────── */}
      <section className="flex min-h-screen flex-col bg-slate-50">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 lg:hidden">
          <BrandMark compact />
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
            University LMS
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-[420px]">
            {/* Title block */}
            <div className="mb-7">
              <div className="mb-4 hidden items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600 lg:flex">
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-indigo-100 bg-indigo-50">
                  <GraduationCapIcon className="h-3.5 w-3.5 text-indigo-600" />
                </span>
                University learning workspace
              </div>

              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                {mfaChallenge ? 'Two-Factor Challenge' : 'Welcome Back'}
              </h1>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-500 sm:text-[15px]">
                {mfaChallenge
                  ? `An extra layer of security is enabled on your account (${mfaChallenge.email}). Enter your authentication code to proceed.`
                  : 'Sign in to continue to your learning workspace.'}
              </p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7">
              {mfaChallenge ? (
                <form onSubmit={onMfaSubmit} noValidate className="space-y-5">
                  {/* Alerts */}
                  <div aria-live="polite" className="space-y-3">
                    {serverError && (
                      <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700"
                      >
                        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <p className="text-xs font-medium leading-5 sm:text-sm">{serverError}</p>
                      </div>
                    )}
                    {successMessage && (
                      <div
                        role="status"
                        className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3.5 text-sm text-emerald-800"
                      >
                        <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-xs font-medium leading-5 sm:text-sm">{successMessage}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mfaCode" className="block text-sm font-semibold text-slate-800">
                      {isBackupCode ? 'Emergency Recovery Code' : '6-Digit Authenticator Code'}
                    </label>
                    <div className="relative">
                      <KeyIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="mfaCode"
                        type="text"
                        autoFocus
                        autoComplete="one-time-code"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.trim())}
                        maxLength={isBackupCode ? 10 : 8}
                        placeholder={isBackupCode ? 'e.g. 1a2b3c4d' : '000000'}
                        className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 font-mono text-center text-lg tracking-widest text-slate-900 placeholder-slate-300 transition-all focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {isBackupCode
                        ? 'Enter one of your 8-character single-use emergency backup codes.'
                        : 'Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy) to view your code.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsBackupCode((prev) => !prev);
                        setMfaCode('');
                        setServerError(null);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      {isBackupCode ? 'Use 6-digit authenticator code instead' : 'Use emergency backup code instead'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon className="h-4 w-4 text-white" />
                        <span>Verifying…</span>
                      </>
                    ) : (
                      <>
                        <span>Verify &amp; Continue</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMfaChallenge(null);
                      setMfaCode('');
                      setServerError(null);
                    }}
                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                    <span>Cancel and return to login</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                  {/* Alerts */}
                  <div aria-live="polite" className="space-y-3">
                    {serverError && (
                      <div
                        role="alert"
                        className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/90 p-3.5 text-sm text-red-700"
                      >
                        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                        <p className="text-xs font-medium leading-5 sm:text-sm">{serverError}</p>
                      </div>
                    )}
                    {successMessage && (
                      <div
                        role="status"
                        className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-3.5 text-sm text-emerald-800"
                      >
                        <CheckCircle2Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <p className="text-xs font-medium leading-5 sm:text-sm">{successMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Multi-tenant selection */}
                  {tenantCandidates.length > 0 && (
                    <fieldset className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-4">
                      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-indigo-900">
                        Choose your institution
                      </legend>
                      <div className="mt-2 grid gap-2">
                        {tenantCandidates.map((tId) => (
                          <button
                            key={tId}
                            type="button"
                            onClick={() => setValue('tenantId', tId, { shouldValidate: true })}
                            className={`flex h-10 items-center gap-2 rounded-md border px-3 text-left font-mono text-xs transition-colors ${
                              selectedTenant === tId
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                : 'border-indigo-200 bg-white text-indigo-950 hover:bg-indigo-100'
                            }`}
                          >
                            <Building2Icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{tId}</span>
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                      Email or username
                    </label>
                    <div className="relative">
                      <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        autoComplete="username"
                        placeholder="name@university.edu"
                        aria-invalid={Boolean(errors.email)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                          errors.email
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                        }`}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs font-medium text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        aria-invalid={Boolean(errors.password)}
                        className={`h-11 w-full rounded-lg border bg-white pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                          errors.password
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                        }`}
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs font-medium text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Institution ID */}
                  {(showInstitution || defaultTenantId) && (
                    <div className="space-y-1.5">
                      <label htmlFor="tenantId" className="block text-sm font-semibold text-slate-800">
                        Institution ID
                      </label>
                      <div className="relative">
                        <Building2Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="tenantId"
                          type="text"
                          autoComplete="organization"
                          placeholder="24-character institution ID"
                          aria-invalid={Boolean(errors.tenantId)}
                          className={`h-11 w-full rounded-lg border bg-white pl-10 pr-3 font-mono text-sm text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 ${
                            errors.tenantId
                              ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                              : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-500/20'
                          }`}
                          {...register('tenantId')}
                        />
                      </div>
                      {errors.tenantId && (
                        <p className="text-xs font-medium text-red-600">{errors.tenantId.message}</p>
                      )}
                    </div>
                  )}

                  {!showInstitution && !defaultTenantId && (
                    <button
                      type="button"
                      onClick={() => setShowInstitution(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800"
                    >
                      <Building2Icon className="h-3.5 w-3.5" />
                      <span>Use a specific institution ID</span>
                    </button>
                  )}

                  {/* Keep signed in */}
                  <div className="flex items-center gap-2.5">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="remember" className="cursor-pointer text-sm font-normal text-slate-600">
                      Keep me signed in
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <SpinnerIcon className="h-4 w-4 text-white" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRightIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {/* Register link */}
                  <p className="border-t border-slate-100 pt-4 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{' '}
                    <Link
                      to="/register"
                      className="font-semibold text-indigo-600 underline-offset-4 hover:underline"
                    >
                      Create student account
                    </Link>
                  </p>

                  {/* Demo Auto Fill */}
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-500">
                    <div>
                      <span className="block font-semibold text-slate-700">Demo Super Admin:</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        superadmin@unisphere.edu
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={fillSuperAdmin}
                      className="cursor-pointer rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-300 hover:bg-slate-50"
                    >
                      Auto Fill
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Security badge */}
            <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
              Protected by UniSphere campus security
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}