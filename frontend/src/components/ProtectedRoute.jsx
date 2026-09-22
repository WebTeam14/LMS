import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, Button } from 'antd';
import useAuthStore from '../stores/useAuthStore.js';

export const ProtectedRoute = ({ children, requiredRole, requiredPermission }) => {
  const location = useLocation();
  const { isAuthenticated, hasRole, can } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <Alert
            type="error"
            showIcon
            message="Access Denied"
            description={`Your account does not have the required role (${requiredRole}) to view this resource.`}
          />
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (requiredPermission && !can(requiredPermission)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <Alert
            type="error"
            showIcon
            message="Permission Denied"
            description={`You lack the required permission (${requiredPermission}) to perform this action.`}
          />
          <Button type="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
