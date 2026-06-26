import { Navigate } from 'react-router';
import { useAuth, UserRole } from '../context/AuthContext';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  allowedDepartments?: string[];
}

export function ProtectedRoute({ children, allowedRoles, allowedDepartments }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Redirect to home if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Redirect to their own dashboard if they don't have permission for role
  if (!allowedRoles.includes(user.role)) {
    const roleDashboardMap: Record<UserRole, string> = {
      citizen: '/dashboard/citizen',
      collector: '/dashboard/collector',
      supervisor: '/dashboard/supervisor',
      administrator: '/dashboard/admin'
    };

    return <Navigate to={roleDashboardMap[user.role]} replace />;
  }

  // Check department if required
  if (allowedDepartments && allowedDepartments.length > 0) {
    if (!user.department || !allowedDepartments.includes(user.department)) {
      // Redirect to their own dashboard
      const roleDashboardMap: Record<UserRole, string> = {
        citizen: '/dashboard/citizen',
        collector: '/dashboard/collector',
        supervisor: '/dashboard/supervisor',
        administrator: '/dashboard/admin'
      };

      return <Navigate to={roleDashboardMap[user.role]} replace />;
    }
  }

  return <>{children}</>;
}
