import { useAuth } from '../lib/useAuth';

interface HeaderProps {
  onAddClick?: () => void;
}

/**
 * Header displays the app title, an "add plant" action, the authenticated
 * user's name/email, and a logout button.
 * Only shown inside ProtectedRoute (always authenticated).
 */
export function Header({ onAddClick }: HeaderProps) {
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = '/.auth/logout';
  };

  return (
    <header style={styles.header}>
      <h1 style={styles.title}>Flowerpot</h1>
      <div style={styles.actions}>
        {user && (
          <>
            <button onClick={onAddClick} style={styles.addButton}>
              + Add Plant
            </button>
            <span style={styles.userName}>{user.name || user.email || 'User'}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Log Out
            </button>
          </>
        )}
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--code-bg)',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    color: 'var(--text-h)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    color: 'var(--text)',
  },
  addButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--button-bg)',
    color: 'var(--button-text)',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    color: 'var(--text)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};
