import React, { useEffect } from 'react';
import useAuthStore from './stores/useAuthStore.js';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Automatically restore and validate session from localStorage on application boot
    initializeAuth();
  }, [initializeAuth]);

  return <AppRoutes />;
}
