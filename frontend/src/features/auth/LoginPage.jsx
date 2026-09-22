import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Alert, Button, Input, Form } from 'antd';
import useAuthStore from '../../stores/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values) => {
    setErrorMessage(null);
    try {
      await login({
        email: values.email,
        password: values.password,
        tenantId: values.tenantId?.trim() || undefined,
      });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-indigo-500/30 mb-4">
          U
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">UniSphere Platform</h2>
        <p className="mt-2 text-sm text-slate-400">
          Advanced University Digital Learning & Academic Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800 border border-slate-700 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6">
              <Alert message="Authentication Error" description={errorMessage} type="error" showIcon />
            </div>
          )}

          <Form layout="vertical" onFinish={onFinish} requiredMark="optional">
            <Form.Item
              label={<span className="text-slate-300 font-medium text-sm">Institutional Email</span>}
              name="email"
              rules={[
                { required: true, message: 'Please enter your email address' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input
                size="large"
                placeholder="name@university.edu"
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-slate-300 font-medium text-sm">Password</span>}
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                size="large"
                placeholder="••••••••"
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <Form.Item
              label={
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-400 font-normal text-xs">
                    Institution / Tenant ID (Optional if unique)
                  </span>
                </div>
              }
              name="tenantId"
            >
              <Input
                size="large"
                placeholder="e.g. 650000000000000000000001"
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 font-mono text-xs hover:border-indigo-500 focus:border-indigo-500"
              />
            </Form.Item>

            <div className="mt-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-11 rounded-lg"
              >
                Sign In to Campus
              </Button>
            </div>
          </Form>

          <div className="mt-6 pt-6 border-t border-slate-700/60 text-xs text-slate-400">
            <p className="font-semibold text-slate-300 mb-1">Default Platform Administrator Credentials:</p>
            <p className="font-mono text-slate-400">Email: superadmin@unisphere.edu</p>
            <p className="font-mono text-slate-400">Password: SuperAdmin2026!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
