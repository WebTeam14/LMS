import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheckIcon,
  LockIcon,
  KeyIcon,
  LaptopIcon,
  SmartphoneIcon,
  Trash2Icon,
  CopyIcon,
  QrCodeIcon,
  ArrowLeftIcon,
  SpinnerIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  UniSphereLogo,
} from '../../../components/common/Icons.jsx';
import useAuthStore from '../../../stores/useAuthStore.js';
import authService from '../services/authService.js';

export default function SecuritySettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // MFA State
  const [mfaData, setMfaData] = useState(null); // { secret, qrCodeUrl, backupCodes }
  const [mfaEnrollCode, setMfaEnrollCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState(null);
  const [mfaError, setMfaError] = useState(null);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(null);
  const [sessionsSuccess, setSessionsSuccess] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  // Load Sessions
  const fetchSessions = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await authService.getSessions();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setSessionsError(err.message || 'Unable to load active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Password Strength Calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-amber-500' };
    if (score <= 4) return { score, label: 'Moderate', color: 'bg-indigo-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  // Handle Password Change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please provide your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters in length.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully. Active sessions have been secured.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      fetchSessions();
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Verify your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle MFA Setup Initiation
  const handleStartMfaSetup = async () => {
    setMfaError(null);
    setMfaSuccess(null);
    setMfaLoading(true);
    try {
      const data = await authService.setupMfa();
      setMfaData(data);
    } catch (err) {
      setMfaError(err.message || 'Failed to initiate MFA setup.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Handle MFA Verification & Activation
  const handleActivateMfa = async (e) => {
    e.preventDefault();
    if (!mfaEnrollCode || mfaEnrollCode.length < 6) {
      setMfaError('Please enter the 6-digit verification code from your authenticator app.');
      return;
    }

    setMfaError(null);
    setMfaLoading(true);
    try {
      await authService.enableMfa(mfaEnrollCode.trim());
      setUser({ ...user, mfaEnabled: true });
      setMfaData(null);
      setMfaEnrollCode('');
      setMfaSuccess('Two-Factor Authentication is now enabled on your account!');
    } catch (err) {
      setMfaError(err.message || 'Verification failed. The code may have expired or is incorrect.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Handle MFA Disablement
  const handleDisableMfa = async (e) => {
    e.preventDefault();
    if (!disablePassword) {
      setMfaError('Please enter your password to confirm disabling two-factor authentication.');
      return;
    }

    setDisableLoading(true);
    setMfaError(null);
    try {
      await authService.disableMfa({ password: disablePassword });
      setUser({ ...user, mfaEnabled: false });
      setShowDisableModal(false);
      setDisablePassword('');
      setMfaSuccess('Two-Factor Authentication has been disabled.');
    } catch (err) {
      setMfaError(err.message || 'Unable to disable 2FA. Verify your password.');
    } finally {
      setDisableLoading(false);
    }
  };

  // Revoke Specific Session
  const handleRevokeSession = async (sessionId) => {
    setRevokingId(sessionId);
    setSessionsError(null);
    setSessionsSuccess(null);
    try {
      await authService.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setSessionsSuccess('Session revoked successfully.');
    } catch (err) {
      setSessionsError(err.message || 'Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  // Revoke All Other Sessions
  const handleRevokeOtherSessions = async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    setSessionsSuccess(null);
    try {
      await authService.revokeOtherSessions();
      setSessionsSuccess('All other sessions terminated.');
      await fetchSessions();
    } catch (err) {
      setSessionsError(err.message || 'Failed to revoke other sessions.');
      setSessionsLoading(false);
    }
  };

  // Copy Backup Codes
  const copyBackupCodes = () => {
    if (!mfaData?.backupCodes) return;
    navigator.clipboard.writeText(mfaData.backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  // Copy Secret
  const copySecret = () => {
    if (!mfaData?.secret) return;
    navigator.clipboard.writeText(mfaData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const isMfaEnabled = Boolean(user?.mfaEnabled);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white px-6 py-3.5 shadow-2xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="transition-opacity hover:opacity-85">
              <UniSphereLogo className="h-8 w-8" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-slate-900">UniSphere</span>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                  Security Hub
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Institutional Access &amp; Credential Protection
              </p>
            </div>
          </div>

          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-5xl p-6 md:p-8 space-y-8">
        {/* Page Title */}
        <div className="border-b border-slate-200/80 pb-6">
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Account Security &amp; Access Controls
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Manage authentication credentials, configure hardware/app multi-factor tokens, and monitor active sessions across campus networks.
          </p>
        </div>

        {/* Global Notifications */}
        <div aria-live="polite" className="space-y-3">
          {mfaSuccess && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-2xs">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{mfaSuccess}</span>
            </div>
          )}
          {sessionsSuccess && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-800 shadow-2xs">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{sessionsSuccess}</span>
            </div>
          )}
        </div>

        {/* ========================================================
            SECTION 1: TWO-FACTOR AUTHENTICATION (MFA)
            ======================================================== */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs md:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3.5">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${
                isMfaEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                <ShieldCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    Two-Factor Authentication (TOTP)
                  </h2>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isMfaEnabled
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border border-amber-200 bg-amber-50 text-amber-700'
                  }`}>
                    {isMfaEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Protect your campus workspace by requiring a time-based verification code on every sign-in.
                </p>
              </div>
            </div>

            <div>
              {isMfaEnabled ? (
                <button
                  type="button"
                  onClick={() => setShowDisableModal(true)}
                  className="cursor-pointer rounded-lg border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 shadow-2xs transition-colors hover:bg-red-50 hover:border-red-300"
                >
                  Disable 2FA
                </button>
              ) : !mfaData ? (
                <button
                  type="button"
                  onClick={handleStartMfaSetup}
                  disabled={mfaLoading}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
                >
                  {mfaLoading ? <SpinnerIcon className="h-3.5 w-3.5" /> : <QrCodeIcon className="h-3.5 w-3.5" />}
                  <span>Enable Two-Factor</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* MFA Setup Enrollment Card */}
          {mfaData && (
            <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 md:p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                <h3 className="text-sm font-semibold text-indigo-950">
                  Setup Two-Factor Authentication
                </h3>
                <button
                  type="button"
                  onClick={() => setMfaData(null)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancel Setup
                </button>
              </div>

              {mfaError && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertCircleIcon className="h-4 w-4 shrink-0" />
                  <span>{mfaError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Step 1: Scan QR */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 text-center">
                  <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                    Step 1: Scan in Authenticator App
                  </span>
                  <div className="grid place-items-center py-2">
                    {mfaData.qrCodeUrl ? (
                      <img
                        src={mfaData.qrCodeUrl}
                        alt="TOTP Enrollment QR Code"
                        className="h-44 w-44 rounded-lg border border-slate-100 shadow-2xs"
                      />
                    ) : (
                      <div className="grid h-44 w-44 place-items-center rounded-lg bg-slate-100 text-xs text-slate-400">
                        Loading QR Code…
                      </div>
                    )}
                  </div>
                  <div className="text-left bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">
                      Manual Secret Key
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <code className="text-xs font-mono text-slate-800 select-all font-semibold">
                        {mfaData.secret}
                      </code>
                      <button
                        type="button"
                        onClick={copySecret}
                        className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <CopyIcon className="h-3 w-3" />
                        <span>{copiedSecret ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Emergency Backup Codes & Verification */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                        Step 2: Save Emergency Backup Codes
                      </span>
                      <button
                        type="button"
                        onClick={copyBackupCodes}
                        className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        <CopyIcon className="h-3 w-3" />
                        <span>{copiedCodes ? 'Copied All' : 'Copy All'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Store these 10 one-time recovery codes in a secure location. They allow login if you ever lose your phone.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-slate-700">
                      {mfaData.backupCodes?.map((code, idx) => (
                        <div key={idx} className="tracking-wider">
                          {idx + 1}. <span className="font-semibold text-slate-900">{code}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Step 3: Enter 6-digit code */}
                  <form onSubmit={handleActivateMfa} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      Step 3: Confirm with 6-Digit Code
                    </span>
                    <div className="space-y-1.5">
                      <label htmlFor="enrollCode" className="block text-xs font-semibold text-slate-700">
                        Authenticator Code
                      </label>
                      <input
                        id="enrollCode"
                        type="text"
                        maxLength={6}
                        value={mfaEnrollCode}
                        onChange={(e) => setMfaEnrollCode(e.target.value.trim())}
                        placeholder="000000"
                        className="h-11 w-full rounded-lg border border-slate-200 bg-white text-center font-mono text-lg tracking-widest text-slate-900 placeholder-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={mfaLoading}
                      className="cursor-pointer flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {mfaLoading ? <SpinnerIcon className="h-3.5 w-3.5" /> : <ShieldCheckIcon className="h-3.5 w-3.5" />}
                      <span>Verify &amp; Activate 2FA</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Disable 2FA Prompt Modal */}
          {showDisableModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600">
                    <AlertCircleIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Disable Two-Factor Authentication?
                    </h3>
                    <p className="text-xs text-slate-500">
                      This lowers your account security perimeter.
                    </p>
                  </div>
                </div>

                {mfaError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {mfaError}
                  </div>
                )}

                <form onSubmit={handleDisableMfa} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="disablePass" className="block text-xs font-semibold text-slate-700">
                      Confirm Account Password
                    </label>
                    <input
                      id="disablePass"
                      type="password"
                      autoFocus
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDisableModal(false);
                        setDisablePassword('');
                        setMfaError(null);
                      }}
                      className="cursor-pointer rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={disableLoading}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {disableLoading && <SpinnerIcon className="h-3 w-3" />}
                      <span>Disable 2FA</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            SECTION 2: CHANGE PASSWORD
            ======================================================== */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs md:p-7 space-y-6">
          <div className="flex items-start gap-3.5 border-b border-slate-100 pb-5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <LockIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Change Account Password</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Ensure your campus credentials meet university cryptographic password requirements.
              </p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
              <CheckCircle2Icon className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="block text-xs font-semibold text-slate-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="newPassword" className="block text-xs font-semibold text-slate-700">
                  New Password
                </label>
                {newPassword && (
                  <span className="text-[11px] font-semibold text-slate-500">
                    Strength: <span className="font-bold">{strength.label}</span>
                  </span>
                )}
              </div>
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              {/* Strength Meter Bar */}
              {newPassword && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${(strength.score / 5) * 100}%` }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="cursor-pointer inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
              >
                {passwordLoading && <SpinnerIcon className="h-3.5 w-3.5" />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </section>

        {/* ========================================================
            SECTION 3: ACTIVE SESSIONS & CONNECTED DEVICES
            ======================================================== */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs md:p-7 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                <LaptopIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Active Sessions &amp; Connected Devices
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Review browser sessions currently authorized to access your university profile.
                </p>
              </div>
            </div>

            {sessions.length > 1 && (
              <button
                type="button"
                onClick={handleRevokeOtherSessions}
                disabled={sessionsLoading}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                Sign Out All Other Devices
              </button>
            )}
          </div>

          {sessionsError && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600" />
              <span>{sessionsError}</span>
            </div>
          )}

          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
              <SpinnerIcon className="h-4 w-4" />
              <span>Loading connected devices…</span>
            </div>
          ) : sessions.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">No active sessions found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((sess) => {
                const isMobile =
                  sess.device?.device?.toLowerCase() === 'mobile' ||
                  sess.device?.os?.toLowerCase().includes('ios') ||
                  sess.device?.os?.toLowerCase().includes('android');

                return (
                  <div
                    key={sess.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                        {isMobile ? (
                          <SmartphoneIcon className="h-4 w-4" />
                        ) : (
                          <LaptopIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            {sess.device?.browser || 'Web Browser'} on {sess.device?.os || 'Unknown Device'}
                          </span>
                          {sess.isCurrent && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.2 text-[10px] font-bold text-emerald-700">
                              Current Device
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 font-mono text-[11px] text-slate-400">
                          <span>IP: {sess.ipAddress || '127.0.0.1'}</span>
                          <span>&bull;</span>
                          <span>
                            Last Active:{' '}
                            {sess.lastActiveAt
                              ? new Date(sess.lastActiveAt).toLocaleString()
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!sess.isCurrent && (
                      <div>
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(sess.id)}
                          disabled={revokingId === sess.id}
                          className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          {revokingId === sess.id ? (
                            <SpinnerIcon className="h-3 w-3" />
                          ) : (
                            <Trash2Icon className="h-3 w-3" />
                          )}
                          <span>Revoke</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
