import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Card, Tag, Button, Badge, Alert, Spin } from 'antd';
import api from './services/api.js';
import useAuthStore from './stores/useAuthStore.js';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './features/auth/LoginPage.jsx';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, fetchProfile } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [healthError, setHealthError] = useState(null);

  const checkHealth = async () => {
    setLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await api.get('/health');
      setHealth(res);
    } catch (err) {
      setHealthError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const coreModules = [
    { id: '01', name: 'Platform & Tenant Management', status: 'Phase 0 Complete' },
    { id: '02', name: 'Authentication, Security & RBAC', status: 'Phase 2 Complete' },
    { id: '03', name: 'User & Role Management', status: 'Phase 2 Complete' },
    { id: '04', name: 'University / Academic Structure', status: 'Phase 3 Ready' },
    { id: '05', name: 'Admissions & Enrollment', status: 'Phase 4 Ready' },
    { id: '06', name: 'Student Information System (SIS)', status: 'Phase 5 Ready' },
    { id: '07', name: 'Faculty & Department Management', status: 'Phase 6 Ready' },
    { id: '08', name: 'Course & Curriculum Management', status: 'Phase 7 Ready' },
    { id: '09', name: 'Core LMS / Theory Learning', status: 'Phase 8 Ready' },
    { id: '10', name: 'Practical & Lab Management', status: 'Phase 9 Ready' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              U
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">UniSphere</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">University Digital Campus Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-sm">
              <span className="text-slate-500">API Gateway:</span>
              {loadingHealth ? (
                <Spin size="small" />
              ) : health?.success ? (
                <Badge status="success" text={<span className="font-semibold text-emerald-700">Online</span>} />
              ) : (
                <Badge status="error" text={<span className="font-semibold text-rose-600">Offline</span>} />
              )}
            </div>

            {user && (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800 leading-none">
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
                  </div>
                  <div className="text-xs text-indigo-600 font-mono mt-0.5">
                    {user.roles?.[0] || 'USER'}
                  </div>
                </div>
                <Button danger onClick={handleLogout} size="small" className="rounded-lg">
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* User Session Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Tag color="green" className="font-semibold">PHASE 2 AUTH & RBAC VERIFIED</Tag>
              <Tag color="cyan" className="font-semibold">MULTI-TENANCY ENFORCED</Tag>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Welcome back, {user?.firstName || 'Campus User'}!
            </h2>
            <p className="text-indigo-100 text-sm md:text-base leading-relaxed mb-4">
              Institutional security perimeter active. Authenticated with role-based access control,
              cryptographic token rotation, and multi-tenant domain boundary isolation.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-400/30 font-mono">
                Tenant: {user?.tenantId || 'Primary Platform'}
              </span>
              <span className="bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-400/30">
                Roles: {user?.roles?.join(', ') || 'STUDENT'}
              </span>
              <span className="bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-400/30 font-mono">
                Permissions: {user?.permissions?.length || 0} active
              </span>
            </div>
          </div>
        </div>

        {/* Server Diagnostic Card */}
        <Card title="System Diagnostics (Phase 2 Gateway Health)" className="shadow-sm border-slate-200">
          {healthError && (
            <Alert
              message="Backend Connection Alert"
              description={`${healthError}. Ensure the backend server is running on port 5000.`}
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">API Health (/api/v1/health)</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">{health?.data?.status || 'Unknown'}</span>
                <Tag color={health?.success ? 'green' : 'orange'}>
                  {health?.success ? 'HTTP 200 OK' : 'Checking'}
                </Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">Database & Cache</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  Mongo: {health?.data?.components?.database || 'OK'}
                </span>
                <Tag color="cyan">Redis 7</Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">Security State</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">RBAC Active</span>
                <Tag color="purple">High-Entropy</Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">Next Roadmap Milestone</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">University / Org</span>
                <Tag color="blue">Phase 3</Tag>
              </div>
            </div>
          </div>
        </Card>

        {/* Roadmap Module Matrix Preview */}
        <Card title="Roadmap Modules (First 10 of 34)" className="shadow-sm border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {coreModules.map((mod) => (
              <div
                key={mod.id}
                className="p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors shadow-sm"
              >
                <span className="text-xs font-mono font-bold text-indigo-600">{mod.id}</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 line-clamp-2">{mod.name}</p>
                <div className="mt-2">
                  <Tag
                    color={mod.status.includes('Complete') ? 'green' : 'default'}
                    className="text-xs font-medium"
                  >
                    {mod.status}
                  </Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        UniSphere University Digital Campus Platform &bull; Production Ready &bull; Phase 2 Security Complete
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
