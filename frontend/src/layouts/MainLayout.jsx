import React from 'react';
import { UniSphereLogo, LogoutIcon } from '../components/common/Icons.jsx';
import useAuthStore from '../stores/useAuthStore.js';
import { useNavigate } from 'react-router-dom';

export const MainLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#fbfbfc] text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UniSphereLogo className="w-8 h-8" />
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm">UniSphere</span>
              <p className="text-[11px] text-slate-400 font-normal leading-none mt-0.5">
                University Digital Campus Platform
              </p>
            </div>
          </div>

          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-600 font-medium">
                {user.firstName ? `${user.firstName} ${user.lastName}` : user.email}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
              >
                <LogoutIcon className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">{children}</main>
    </div>
  );
};

export default MainLayout;
