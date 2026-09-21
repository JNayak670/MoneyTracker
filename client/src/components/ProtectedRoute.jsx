import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ColorfulLoader from './ColorfulLoader';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <ColorfulLoader
        fullScreen={true}
        message="Authenticating MoneyTracker..."
        submessage="Validating secure credentials and syncing ledger connections..."
      />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
