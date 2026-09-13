import { useAuth } from '../lib/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute guards content behind authentication.
 * Shows a loading state while checking auth, redirects unauthenticated users to login,
 * and renders children only when authenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    // Redirect to SWA built-in auth endpoint
    window.location.href = '/.auth/login/aad';
    return null;
  }

  return <>{children}</>;
}
