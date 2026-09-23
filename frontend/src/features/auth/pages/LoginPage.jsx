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
} from '../../../components/common/Icons.jsx';
import useAuthStore from '../../../stores/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [showInstitution, setShowInstitution] = useState(false);
  const [tenantCandidates, setTenantCandidates] = useState([]);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

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
      await login({
        email: values.email,
        password: values.password,
        tenantId: values.tenantId?.trim() || undefined,
      });

      setSuccessMessage('Signed in successfully. Opening your workspace…');
      window.setTimeout(() => {
        navigate(from, { replace: true });
      }, 350);
    } catch (err) {
      if (err.code === 'TENANT_REQUIRED' && err.details?.tenantIds?.length) {
        setTenantCandidates(err.details.tenantIds);
        setShowInstitution(true);
        setServerError('Your email belongs to more than one institution. Choose the correct campus to continue.');
      } else {
        setServerError(err.message || 'Authentication failed. Please verify credentials.');
      }
    }
  };

  const fillSuperAdmin = () => {
    setValue('email', 'superadmin@unisphere.edu');
    setValue('password', 'SuperAdmin2026!');
    setValue('tenantId', defaultTenantId || '650000000000000000000001');
    setServerError(null);
  };

  return (
    <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(520px,0.92fr)]">
      {/* Left Section (Desktop Hero) */}
      <section
        className="relative hidden min-h-screen overflow-hidden bg-brand-deep text-white lg:flex lg:flex-col lg:justify-between"
        aria-label="UniSphere digital campus"
      >
        <img
          src={campusImage}
          alt="Students walking through a modern university learning commons at dusk"
          width={1280}
          height={1536}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Dark brand tint and vertical vignette overlays */}
        <div className="absolute inset-0 bg-brand-deep/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-deep/80 via-brand-deep/25 to-brand-deep/95" />

        <header className="relative z-10 p-10 xl:p-14">
          <BrandMark />
        </header>

        <div className="relative z-10 max-w-2xl p-10 xl:p-14">
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-teal-400">
            <span className="h-px w-8 bg-teal-400" />
            One campus. Every possibility.
          </div>
          <h2 className="max-w-xl font-display text-5xl font-medium leading-[1.04] xl:text-6xl text-white">
            Your academic world, thoughtfully connected.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-200">
            Learn, collaborate, and stay connected to your university community—all from one secure workspace.
          </p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 border-t border-white/20 pt-6 text-sm text-slate-200">
            <span className="flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4 text-teal-400" /> Courses
            </span>
            <span className="flex items-center gap-2">
              <Building2Icon className="w-4 h-4 text-teal-400" /> Campus
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-teal-400" /> Secure
            </span>
          </div>
        </div>
      </section>

      {/* Right Section (Auth Form) */}
      <section className="flex min-h-screen flex-col bg-slate-50">
        {/* Mobile Header (Hidden on lg+) */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:hidden">
          <BrandMark compact />
          <span className="shrink-0 text-xs font-medium text-slate-500">University LMS</span>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="w-full max-w-md">
            {/* Header Badge & Title */}
            <div className="mb-8">
              <div className="mb-5 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 lg:flex">
                <span className="grid size-7 place-items-center rounded-md bg-indigo-50 border border-indigo-100">
                  <GraduationCapIcon className="w-4 h-4 text-indigo-600" />
                </span>
                University learning workspace
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
                Welcome Back
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                Sign in to continue to your learning workspace.
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Feedback Alerts */}
              <div aria-live="polite" className="space-y-3">
                {serverError && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50/90 p-4 text-sm text-red-700"
                  >
                    <ShieldCheckIcon className="mt-0.5 w-4 h-4 shrink-0 text-red-600" />
                    <p className="leading-5 text-xs sm:text-sm font-medium">{serverError}</p>
                  </div>
                )}
                {successMessage && (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800"
                  >
                    <CheckCircle2Icon className="mt-0.5 w-4 h-4 shrink-0 text-emerald-600" />
                    <p className="leading-5 text-xs sm:text-sm font-medium">{successMessage}</p>
                  </div>
                )}
              </div>

              {/* Multi-Tenant Campus Collision Selection (UNI-017) */}
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
                        className={`h-10 px-3 flex items-center gap-2 rounded-md font-mono text-xs text-left transition-colors border ${
                          selectedTenant === tId
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        <Building2Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{tId}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {/* Email / Username Field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                  Email or username
                </label>
                <div className="relative">
                  <MailIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="name@university.edu"
                    aria-invalid={Boolean(errors.email)}
                    className={`h-12 w-full rounded-lg bg-white pl-10 pr-3 text-sm text-slate-900 placeholder-slate-400 border transition-all focus:outline-none focus:ring-2 ${
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

              {/* Password Field */}
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
                  <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={Boolean(errors.password)}
                    className={`h-12 w-full rounded-lg bg-white pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 border transition-all focus:outline-none focus:ring-2 ${
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
                    {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Optional Institution ID Field */}
              {(showInstitution || defaultTenantId) && (
                <div className="space-y-1.5">
                  <label htmlFor="tenantId" className="block text-sm font-semibold text-slate-800">
                    Institution ID
                  </label>
                  <div className="relative">
                    <Building2Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="tenantId"
                      type="text"
                      autoComplete="organization"
                      placeholder="24-character institution ID"
                      aria-invalid={Boolean(errors.tenantId)}
                      className={`h-12 w-full rounded-lg bg-white pl-10 pr-3 font-mono text-sm text-slate-900 placeholder-slate-400 border transition-all focus:outline-none focus:ring-2 ${
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
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <Building2Icon className="w-3.5 h-3.5" />
                  <span>Use a specific institution ID</span>
                </button>
              )}

              {/* Keep me signed in Checkbox */}
              <div className="flex items-center gap-2.5">
                <input
                  id="remember"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="remember" className="text-sm font-normal text-slate-600 cursor-pointer">
                  Keep me signed in
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 text-white" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Account Registration Link */}
              <p className="border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-indigo-600 underline-offset-4 hover:underline"
                >
                  Create student account
                </Link>
              </p>

              {/* Quick Demo Pre-fill for Local Developer / Evaluator */}
              <div className="mt-4 p-3 rounded-lg bg-slate-100 border border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700 block">Demo Super Admin:</span>
                  <span className="text-slate-500 font-mono text-[11px]">superadmin@unisphere.edu</span>
                </div>
                <button
                  type="button"
                  onClick={fillSuperAdmin}
                  className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-semibold text-slate-700 text-xs hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  Auto Fill
                </button>
              </div>
            </form>

            {/* Campus Security Badge Footer */}
            <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
              <span>Protected by UniSphere campus security</span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
