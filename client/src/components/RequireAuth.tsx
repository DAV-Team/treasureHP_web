import { useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Sends signed-out visitors to the login page and brings them back afterwards.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [wasSignedIn, setWasSignedIn] = useState(false);
  if (user && !wasSignedIn) setWasSignedIn(true);

  if (isLoading) return <p role="status" className="grid min-h-screen place-items-center text-sm text-slate-500">Đang tải...</p>;
  // Someone who just logged out from this page should land on the home page, not be asked to log in again.
  if (!user && wasSignedIn) return <Navigate to="/" replace />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
