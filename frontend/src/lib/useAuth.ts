import { useEffect, useState } from 'react';

export interface UseAuthReturn {
  user: { id?: string; email?: string; name?: string } | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetches the current user's authentication state from /.auth/me (SWA built-in endpoint).
 * Returns user info on 200, null on 401, and handles errors gracefully.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UseAuthReturn['user']>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const response = await fetch('/.auth/me', { credentials: 'include' });

        if (response.status === 401) {
          setUser(null);
          setError(null);
        } else if (response.ok) {
          const data = await response.json() as { clientPrincipal?: { userDetails?: string; userId?: string } | null };
          if (data.clientPrincipal) {
            setUser({
              id: data.clientPrincipal.userId,
              email: data.clientPrincipal.userDetails,
              name: data.clientPrincipal.userDetails?.split('@')[0],
            });
          } else {
            setUser(null);
          }
          setError(null);
        } else {
          setUser(null);
          setError(new Error(`Auth fetch failed: ${response.statusText}`));
        }
      } catch (err) {
        setUser(null);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAuth();
  }, []);

  return { user, loading, error };
}
