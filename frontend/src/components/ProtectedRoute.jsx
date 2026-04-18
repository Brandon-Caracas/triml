import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../services/store';

export default function ProtectedRoute({ children, rol }) {
  const { isAuthenticated, usuario } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (rol && usuario?.rol !== rol) {
    return <Navigate to="/login" />;
  }

  return children;
}
