import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Redirect to intended page or chat
    const from = location.state?.from?.pathname || '/chat';
    return <Navigate to={from} replace />;
  }

  return children;
};

export default PublicRoute;