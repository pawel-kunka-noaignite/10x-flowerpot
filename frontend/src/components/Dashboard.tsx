import { useState, useEffect } from 'react';
import type { Plant, CareTask, PlantWithTasksResponse } from '@10x-flowerpot/shared';
import { AddPlantForm } from './AddPlantForm';
import { PlantCard } from './PlantCard';

interface DashboardProps {
  showAddForm: boolean;
  onCloseAddForm: () => void;
}

/**
 * Dashboard is the authenticated landing page.
 * Shows the user's plants with their care tasks. The "Add Plant" form is
 * opened on demand (via the header button) as a modal overlay.
 */
export function Dashboard({ showAddForm, onCloseAddForm }: DashboardProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plants and tasks on mount
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/plants');
        if (!response.ok) throw new Error('Failed to fetch plants');
        const plantList = (await response.json()) as Plant[];
        setPlants(plantList);

        // Fetch tasks for all plants
        const allTasks: CareTask[] = [];
        for (const plant of plantList) {
          try {
            const tasksResponse = await fetch(`/api/tasks?plantId=${plant.id}`);
            if (tasksResponse.ok) {
              const plantTasks = (await tasksResponse.json()) as CareTask[];
              allTasks.push(...plantTasks);
            }
          } catch (err) {
            console.error(`Failed to fetch tasks for plant ${plant.id}:`, err);
          }
        }
        setTasks(allTasks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load plants');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlants();
  }, []);

  const handlePlantAdded = (response: PlantWithTasksResponse) => {
    // Add new plant to list
    setPlants((prev) => [...prev, response.plant]);
    // Add new tasks to list
    setTasks((prev) => [...prev, ...response.initialTasks]);
    // Close the modal now that the plant has been added
    onCloseAddForm();
  };

  const getPlantTasks = (plantId: string): CareTask[] => {
    return tasks.filter((task) => task.plantId === plantId);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Your Plants</h1>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.loading}>Loading plants...</div>
      ) : plants.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No plants yet. Click "+ Add Plant" to get started!</p>
        </div>
      ) : (
        <div style={styles.plantsList}>
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              tasks={getPlantTasks(plant.id)}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <div style={styles.modalBackdrop} onClick={onCloseAddForm}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <AddPlantForm onPlantAdded={handlePlantAdded} onCancel={onCloseAddForm} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    padding: '2rem',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  heading: {
    color: 'var(--text-h)',
  },
  plantsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '2.5rem',
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center' as const,
    backgroundColor: 'var(--code-bg)',
    borderRadius: '8px',
    color: 'var(--text)',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: 'var(--text)',
  },
  error: {
    padding: '1rem',
    backgroundColor: 'var(--error-bg)',
    color: 'var(--error-text)',
    borderRadius: '4px',
    marginBottom: '1.5rem',
  },
  modalBackdrop: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 100,
  },
  modalContent: {
    width: '100%',
    maxWidth: '420px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
  },
};
