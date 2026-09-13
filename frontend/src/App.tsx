import { useState } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <ProtectedRoute>
      <Header onAddClick={() => setShowAddForm(true)} />
      <Dashboard
        showAddForm={showAddForm}
        onCloseAddForm={() => setShowAddForm(false)}
      />
    </ProtectedRoute>
  );
}
