import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerSchema } from '../schemas/authSchemas.js';
import { AuthLayout } from '../components/AuthLayout.jsx';
import { AuthInput } from '../components/AuthInput.jsx';
import { AuthButton } from '../components/AuthButton.jsx';
import { AuthAlert } from '../components/AuthAlert.jsx';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter.jsx';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  BuildingIcon,
  ShieldCheckIcon,
} from '../../../components/common/Icons.jsx';
import useAuthStore from '../../../stores/useAuthStore.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading } = useAuthStore();
  const [serverError, setServerError] = useState(null);

  const defaultTenantId = import.meta.env.VITE_DEFAULT_TENANT_ID || '650000000000000000000001';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      tenantId: defaultTenantId,
      acceptTerms: false,
    },
  });

  const currentPassword = watch('password');

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        tenantId: values.tenantId,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <AuthLayout
      title="Create Student Account"
      subtitle="Register as a student in your university digital campus."
      badgeText="Student Self-Registration"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 text-left">
        {serverError && <AuthAlert type="error" message={serverError} />}

        {/* Institutional notice regarding role (UNI-014) */}
        <div className="rounded-xl bg-slate-100/90 border border-slate-200/80 p-3 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
          <span>
            Self-registration strictly grants the <strong className="text-slate-800">STUDENT</strong> role.
            Faculty and institutional staff accounts are provisioned via administrative invitation.
          </span>
        </div>

        {/* Name Fields (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <AuthInput
            label="First Name"
            placeholder="Jane"
            icon={UserIcon}
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <AuthInput
            label="Last Name"
            placeholder="Doe"
            icon={UserIcon}
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <AuthInput
          label="Institutional Email"
          type="email"
          placeholder="jane.doe@university.edu"
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
          {...register('password')}
        />

        {/* Live Password Complexity Feedback */}
        <PasswordStrengthMeter password={currentPassword} />

        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          icon={LockIcon}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <AuthInput
          label="Institution / Tenant ID"
          placeholder="e.g. 650000000000000000000001"
          icon={BuildingIcon}
          helperText="24-character hexadecimal ID provided by your university"
          error={errors.tenantId?.message}
          {...register('tenantId')}
        />

        {/* Terms of Use */}
        <div className="pt-1">
          <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
              {...register('acceptTerms')}
            />
            <span>
              I agree to the institutional code of conduct and digital campus privacy policy.
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-rose-600 mt-1 pl-0.5">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <div className="pt-2">
          <AuthButton type="submit" loading={isLoading}>
            Complete Student Registration
          </AuthButton>
        </div>

        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
