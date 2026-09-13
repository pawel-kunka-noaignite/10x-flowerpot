import { useState, useEffect } from 'react';
import type { Plant, CareTask, PlantWithTasksResponse } from '@10x-flowerpot/shared';
import { AddPlantForm } from './AddPlantForm';
import { PlantCard } from './PlantCard';

/**
 * Dashboard is the authenticated landing page.
 * Shows the add plant form and a list of the user's plants with their care tasks.
 */
export function Dashboard() {
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
  };

  const getPlantTasks = (plantId: string): CareTask[] => {
    return tasks.filter((task) => task.plantId === plantId);
  };

  return (
    <div style={styles.container}>
      <h1>Flowerpot Dashboard</h1>

      {error && <div style={styles.error}>{error}</div>}

      {/* Add Plant Form Section */}
      <section style={styles.formSection}>
        <AddPlantForm onPlantAdded={handlePlantAdded} />
      </section>

      {/* Plants List Section */}
      <section style={styles.plantsSection}>
        <h2>Your Plants</h2>

        {loading ? (
          <div style={styles.loading}>Loading plants...</div>
        ) : plants.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No plants yet. Add one to get started!</p>
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
      </section>
    </div>
  );
}

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  formSection: {
    marginBottom: '3rem',
  },
  plantsSection: {
    marginTop: '2rem',
  },
  plantsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginTop: '1.5rem',
  },
  emptyState: {
    padding: '2rem',
    textAlign: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    color: '#666',
  },
  loading: {
    padding: '2rem',
    textAlign: 'center' as const,
    color: '#999',
  },
  error: {
    padding: '1rem',
    backgroundColor: '#fdd',
    color: '#c33',
    borderRadius: '4px',
    marginBottom: '1.5rem',
  },
};
