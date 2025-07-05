import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../data/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />; // or show an Access Denied page
  }
  return children;
};

export default ProtectedRoute; 