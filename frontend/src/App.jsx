import React, { useEffect, useState } from 'react';
import { Card, Tag, Button, Badge, Alert, Spin } from 'antd';
import api from './services/api.js';

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get('/health');
      setHealth(data);
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const coreModules = [
    { id: '01', name: 'Platform & Tenant Management', status: 'Phase 0' },
    { id: '02', name: 'Authentication & Security', status: 'Phase 2' },
    { id: '03', name: 'User & Role Management', status: 'Phase 2' },
    { id: '04', name: 'University / Academic Structure', status: 'Phase 3' },
    { id: '05', name: 'Admissions', status: 'Phase 4' },
    { id: '06', name: 'Student Information System', status: 'Phase 5' },
    { id: '07', name: 'Faculty Management', status: 'Phase 6' },
    { id: '08', name: 'Course & Curriculum Management', status: 'Phase 7' },
    { id: '09', name: 'Core LMS / Theory Learning', status: 'Phase 8' },
    { id: '10', name: 'Practical & Lab Management', status: 'Phase 9' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
              U
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">UniSphere</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">University Digital Campus Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-slate-500">Backend Status:</span>
              {loading ? (
                <Spin size="small" />
              ) : health?.success ? (
                <Badge status="success" text={<span className="font-semibold text-emerald-700">Online</span>} />
              ) : (
                <Badge status="error" text={<span className="font-semibold text-rose-600">Offline / Pending</span>} />
              )}
            </div>
            <Button type="primary" onClick={checkHealth} loading={loading} className="bg-blue-600">
              Refresh Status
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="max-w-2xl relative z-10">
            <Tag color="cyan" className="font-semibold mb-3">PHASE 1 FOUNDATION COMPLETE</Tag>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">
              Advanced University Digital Learning & Academic Platform
            </h2>
            <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-4">
              MERN Stack Modular Monolith architecture prepared for future microservice extraction.
              Full foundation verified with Express, Mongoose, Redis, Vite, React 18, and Tailwind CSS.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">Node.js LTS</span>
              <span className="bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">Express 4.21</span>
              <span className="bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">MongoDB 7</span>
              <span className="bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">Redis 7</span>
              <span className="bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">React 18 + Vite 5</span>
              <span className="bg-blue-900/60 px-3 py-1 rounded-full border border-blue-400/30">Ant Design + Tailwind</span>
            </div>
          </div>
        </div>

        {/* Server Diagnostic Card */}
        <Card title="System Diagnostics" className="shadow-sm border-slate-200">
          {error && (
            <Alert
              message="Backend Connection Alert"
              description={`${error}. Ensure the backend server is running on port 5000.`}
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">API Health</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">{health?.data?.status || 'Unknown'}</span>
                <Tag color={health?.success ? 'green' : 'orange'}>
                  {health?.success ? 'HTTP 200 OK' : 'Checking'}
                </Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">Architecture</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">Modular Monolith</span>
                <Tag color="blue">MERN</Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">Active Phase</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">Phase 1 &rarr; Phase 2</span>
                <Tag color="purple">Foundation</Tag>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold uppercase text-slate-500">Next Milestone</span>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-bold text-slate-800">Auth & RBAC</span>
                <Tag color="cyan">Phase 2</Tag>
              </div>
            </div>
          </div>
        </Card>

        {/* Roadmap Module Matrix Preview */}
        <Card title="Roadmap Modules (First 10 of 34)" className="shadow-sm border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {coreModules.map((mod) => (
              <div key={mod.id} className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
                <span className="text-xs font-mono font-bold text-blue-600">{mod.id}</span>
                <p className="text-sm font-semibold text-slate-800 mt-1 line-clamp-2">{mod.name}</p>
                <div className="mt-2">
                  <Tag color="default" className="text-xs">{mod.status}</Tag>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        UniSphere LMS Starter Environment &bull; Master Development Roadmap &bull; Phase 1 Foundation
      </footer>
    </div>
  );
}
