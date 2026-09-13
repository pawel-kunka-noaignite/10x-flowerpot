import { useAuth } from '../lib/useAuth';

/**
 * Header displays the authenticated user's name/email and a logout button.
 * Only shown inside ProtectedRoute (always authenticated).
 */
export function Header() {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/.auth/logout';
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem',
        borderBottom: '1px solid #ccc',
        backgroundColor: '#f9f9f9',
      }}
    >
      <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Flowerpot</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <>
            <span>{user.name || user.email || 'User'}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Log Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
