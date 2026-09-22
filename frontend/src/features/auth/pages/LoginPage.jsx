import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginSchema } from '../schemas/authSchemas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { AuthInput } from '../components/AuthInput.jsx';
import { AuthButton } from '../components/AuthButton.jsx';
import { AuthAlert } from '../components/AuthAlert.jsx';
import { MailIcon, LockIcon, BuildingIcon, ArrowRightIcon } from '../../../components/common/Icons.jsx';
import useAuthStore from '../../../stores/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [serverError, setServerError] = useState(null);
  const [tenantCandidates, setTenantCandidates] = useState(null);
  const [showTenantInput, setShowTenantInput] = useState(false);

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

  const currentTenantId = watch('tenantId');

  const onSubmit = async (values) => {
    setServerError(null);
    setTenantCandidates(null);
    try {
      await login({
        email: values.email,
        password: values.password,
        tenantId: values.tenantId?.trim() || undefined,
      });
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code === 'TENANT_REQUIRED' && err.details?.tenantIds) {
        setTenantCandidates(err.details.tenantIds);
        setShowTenantInput(true);
        setServerError('Your email is registered with multiple institutions. Please select or enter your institution ID.');
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
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your institutional credentials to access your digital campus."
      badgeText="UniSphere Authentication"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {serverError && <AuthAlert type="error" message={serverError} />}

        {/* Multi-Tenant Selection Helper (UNI-017) */}
        {tenantCandidates && tenantCandidates.length > 0 && (
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs space-y-2">
            <p className="font-semibold text-indigo-950">Select your institution:</p>
            <div className="flex flex-wrap gap-1.5">
              {tenantCandidates.map((tId) => (
                <button
                  key={tId}
                  type="button"
                  onClick={() => {
                    setValue('tenantId', tId);
                    setTenantCandidates(null);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                    currentTenantId === tId
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  {tId}
                </button>
              ))}
            </div>
          </div>
        )}

        <AuthInput
          label="Institutional Email"
          type="email"
          placeholder="username@university.edu"
          icon={MailIcon}
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={LockIcon}
          error={errors.password?.message}
          rightAction={
            <Link
              to="/forgot-password"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
            >
              Forgot password?
            </Link>
          }
          {...register('password')}
        />

        {/* Optional Institution ID Accordion / Input */}
        <div>
          {!showTenantInput && !defaultTenantId ? (
            <button
              type="button"
              onClick={() => setShowTenantInput(true)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
            >
              <span>+ Specific Institution / Tenant ID</span>
            </button>
          ) : (
            <AuthInput
              label="Institution / Tenant ID"
              placeholder="e.g. 650000000000000000000001"
              icon={BuildingIcon}
              helperText="Required if email exists across multiple campuses"
              error={errors.tenantId?.message}
              {...register('tenantId')}
            />
          )}
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={isLoading} icon={ArrowRightIcon}>
            Sign In to Campus
          </AuthButton>
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>New student? </span>
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
          >
            Create student account
          </Link>
        </div>

        {/* Quick Demo Pre-fill for Local Developer / Evaluator */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center justify-between">
          <div>
            <span className="font-semibold text-slate-700">Demo Super Admin:</span>
            <span className="block text-slate-400 font-mono text-[10px]">superadmin@unisphere.edu</span>
          </div>
          <button
            type="button"
            onClick={fillSuperAdmin}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 rounded-md font-semibold text-slate-700 text-[11px] hover:bg-slate-100 transition-colors shadow-2xs"
          >
            Auto Fill
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
