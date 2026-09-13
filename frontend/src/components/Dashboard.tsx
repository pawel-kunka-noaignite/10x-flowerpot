/**
 * Dashboard is the authenticated landing page.
 * Currently shows an empty state; S-02 will replace this with plant list and care tasks.
 */
export function Dashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h2>Welcome to Flowerpot</h2>
      <p>Your plant care dashboard is ready.</p>
      <p style={{ color: '#999', fontSize: '0.9rem' }}>
        (Coming soon: Add plants and track care tasks)
      </p>
    </div>
  );
}
