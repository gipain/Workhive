import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { PageLoader } from '../ui/Skeleton';
import type { UserRole } from '../../types';

export interface ProtectedRouteProps {
  roles?: UserRole[];
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ roles, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const effectiveRoles = allowedRoles ?? roles;

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (effectiveRoles && user && !effectiveRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return <Outlet />;
}
