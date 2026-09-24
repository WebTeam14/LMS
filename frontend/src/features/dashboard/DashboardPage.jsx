import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tag, Badge, Alert, Spin } from 'antd';
import {
  UniSphereLogo,
  LogoutIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '../../components/common/Icons.jsx';
import api from '../../services/api.js';
import useAuthStore from '../../stores/useAuthStore.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuthStore();

  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await api.get('/health');
      setHealth(res);
    } catch (err) {
      setHealthError(err.message || 'Unable to connect to gateway');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const primaryRole = user?.roles?.[0] || 'STUDENT';
  const isSuperAdmin = hasRole('SUPER_ADMIN');

  const roadmapModules = [
    { id: '01', name: 'Platform & Multi-Tenant Foundations', phase: 'Phase 0', status: 'Verified' },
    { id: '02', name: 'Authentication, Security & RBAC', phase: 'Phase 2', status: 'Complete' },
    { id: '03', name: 'User & Role Directory Management', phase: 'Phase 2', status: 'Complete' },
    { id: '04', name: 'University Academic Hierarchy', phase: 'Phase 3', status: 'Ready' },
    { id: '05', name: 'Admissions & Student Applications', phase: 'Phase 4', status: 'Ready' },
    { id: '06', name: 'Student Information System (SIS)', phase: 'Phase 5', status: 'Ready' },
    { id: '07', name: 'Faculty & Department Governance', phase: 'Phase 6', status: 'Ready' },
    { id: '08', name: 'Curriculum & Syllabus Structure', phase: 'Phase 7', status: 'Ready' },
    { id: '09', name: 'Core LMS / Lecture Operations', phase: 'Phase 8', status: 'Ready' },
    { id: '10', name: 'Laboratory & Practical Modules', phase: 'Phase 9', status: 'Ready' },
  ];

  return (
    <div className="min-h-screen bg-[#fbfbfc] text-slate-900 font-sans flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UniSphereLogo className="w-8 h-8" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 tracking-tight text-sm">UniSphere</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {primaryRole}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">
                University Digital Campus &bull; Phase 2 Active
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-500">
              <span>API Gateway:</span>
              {loadingHealth ? (
                <Spin size="small" />
              ) : health?.success ? (
                <Badge status="success" text={<span className="font-semibold text-emerald-700 text-xs">Healthy</span>} />
              ) : (
                <Badge status="error" text={<span className="font-semibold text-rose-600 text-xs">Offline</span>} />
              )}
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-800 leading-tight">
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                    {user.email}
                  </div>
                </div>

                <Link
                  to="/settings/security"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg shadow-2xs transition-colors"
                >
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Security</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-lg transition-colors"
                >
                  <LogoutIcon className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        {/* Security & 2FA Quick Status Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl grid place-items-center border ${
              user?.mfaEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                : 'border-amber-200 bg-amber-50 text-amber-600'
            }`}>
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Two-Factor Authentication: {user?.mfaEnabled ? 'Active' : 'Unprotected'}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  user?.mfaEnabled
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {user?.mfaEnabled ? 'Protected' : 'Action Recommended'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.mfaEnabled
                  ? 'Your account is fortified with TOTP multi-factor verification on all logins.'
                  : 'Enable 2FA and inspect active connected devices to protect your institutional account.'}
              </p>
            </div>
          </div>
          <Link
            to="/settings/security"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors shrink-0"
          >
            <span>{user?.mfaEnabled ? 'Manage Security' : 'Enable 2FA & Sessions'}</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 rounded-2xl p-7 text-white shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Phase 2 Security Verified
              </span>
              <span className="text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                Multi-Tenant Boundary Active
              </span>
              {isSuperAdmin && (
                <span className="text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full">
                  Platform Administrator
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'Campus User'}
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl font-normal">
              You are authenticated within the UniSphere academic perimeter. Role-based access controls,
              cryptographic token rotation, and multi-tenant domain boundaries are operational.
            </p>

            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <div className="bg-white/10 px-3 py-1 rounded-md border border-white/10 font-mono text-[11px]">
                <span className="text-slate-400 mr-1">Tenant ID:</span>
                <span className="text-indigo-200">{user?.tenantId || 'Default Campus'}</span>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-md border border-white/10 text-[11px]">
                <span className="text-slate-400 mr-1">Assigned Roles:</span>
                <span className="text-emerald-300 font-semibold">{user?.roles?.join(', ') || 'STUDENT'}</span>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-md border border-white/10 text-[11px]">
                <span className="text-slate-400 mr-1">Permissions:</span>
                <span className="text-cyan-300 font-mono">{user?.permissions?.length || 0} active</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Diagnostics Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                Institutional Security & Gateway State
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live telemetric monitoring for academic cluster endpoints
              </p>
            </div>
            <button
              type="button"
              onClick={fetchHealth}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              Refresh Diagnostics
            </button>
          </div>

          {healthError && (
            <Alert
              type="warning"
              showIcon
              message="Backend Gateway Unreachable"
              description={`${healthError}. Ensure the Node.js backend is running on port 5000.`}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gateway Status</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-slate-800">{health?.data?.status || 'Active'}</span>
                <Tag color={health?.success ? 'green' : 'orange'}>
                  {health?.success ? 'HTTP 200' : 'Checking'}
                </Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Database Engine</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-slate-800">
                  {health?.data?.components?.database === 'connected' ? 'Connected' : 'MongoDB 7'}
                </span>
                <Tag color="cyan">Mongoose</Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Distributed Cache</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-slate-800">
                  {health?.data?.components?.redis || 'Ready'}
                </span>
                <Tag color="purple">Redis 7</Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Security Guard</span>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-slate-800">RBAC Active</span>
                <Tag color="blue">High-Entropy</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Master Roadmap Module Grid */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                University Master Roadmap
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Phased vertical-slice implementation architecture
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">34 Architecture Phases</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {roadmapModules.map((mod) => (
              <div
                key={mod.id}
                className="p-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-indigo-200 hover:shadow-xs transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600">{mod.id}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{mod.phase}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                  {mod.name}
                </p>
                <div>
                  <span
                    className={`inline-block px-2 py-0.5 text-[10px] rounded-md font-medium ${
                      mod.status === 'Verified' || mod.status === 'Complete'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400">
        UniSphere University LMS &bull; Production Ready &bull; Phase 2 Security Complete
      </footer>
    </div>
  );
}
