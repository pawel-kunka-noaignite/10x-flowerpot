import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

export default function App() {
  return (
    <ProtectedRoute>
      <Header />
      <Dashboard />
    </ProtectedRoute>
  );
}
