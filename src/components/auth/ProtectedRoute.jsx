import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, currentUser, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If customer attempts to access administrative pages, redirect to customer tracking portal
  if (role === 'customer' && location.pathname !== '/portal') {
    return <Navigate to="/portal" replace />;
  }

  // If specific role requirements exist
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
