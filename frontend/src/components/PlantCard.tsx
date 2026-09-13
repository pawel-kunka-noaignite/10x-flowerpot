import { useEffect, useState } from 'react';
import type { Plant, CareTask, Species } from '@10x-flowerpot/shared';
import { careActionLabel } from '../lib/careLabel';

interface PlantCardProps {
  plant: Plant;
  tasks: CareTask[];
}

/**
 * Calculates days remaining from a due date to today.
 * Returns a positive number if due date is in the future.
 * Returns 0 if due date is today or in the past.
 */
export function daysUntilDue(dueAt: string, now: Date = new Date()): number {
  const dueDate = new Date(dueAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

export function PlantCard({ plant, tasks }: PlantCardProps) {
  const [species, setSpecies] = useState<Species | null>(null);
  const [speciesLoading, setSpeciesLoading] = useState(true);

  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const response = await fetch('/api/species');
        if (!response.ok) throw new Error('Failed to fetch species');
        const speciesList = (await response.json()) as Species[];
        const found = speciesList.find((s) => s.id === plant.speciesId);
        setSpecies(found || null);
      } catch (err) {
        console.error('Failed to load species:', err);
      } finally {
        setSpeciesLoading(false);
      }
    };

    fetchSpecies();
  }, [plant.speciesId]);

  // Sort tasks by dueAt date
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  );

  const speciesName = speciesLoading ? 'Loading...' : species?.commonName || 'Unknown';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.plantName}>{plant.nickname}</h3>
        <span style={styles.badge}>{getLightBadge(plant.lightExposure)}</span>
      </div>

      <p style={styles.species}>Species: {speciesName}</p>

      <div style={styles.tasksContainer}>
        <h4 style={styles.tasksTitle}>Care Schedule</h4>
        {sortedTasks.length === 0 ? (
          <p style={styles.noTasks}>No tasks scheduled</p>
        ) : (
          <ul style={styles.tasksList}>
            {sortedTasks.map((task) => {
              const daysRemaining = daysUntilDue(task.dueAt);
              const taskLabel = careActionLabel(task.action);
              const dueText =
                daysRemaining === 0
                  ? 'Due today'
                  : `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;

              return (
                <li key={task.id} style={styles.taskItem}>
                  <span style={styles.taskAction}>{taskLabel}:</span>
                  <span style={styles.taskDue}>{dueText}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function getLightBadge(lightExposure: string): string {
  const badges: Record<string, string> = {
    low: '🌑 Low',
    medium: '🌤️ Medium',
    bright: '☀️ Bright',
  };
  return badges[lightExposure] || lightExposure;
}

const styles = {
  card: {
    padding: '1.5rem',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    backgroundColor: 'var(--code-bg)',
    boxShadow: 'var(--shadow)',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '0.5rem 0.75rem',
    marginBottom: '1.25rem',
  },
  plantName: {
    margin: '0',
    fontSize: '1.3rem',
    lineHeight: 1.4,
    fontWeight: 'bold',
    color: 'var(--text-h)',
    overflowWrap: 'anywhere' as const,
  },
  badge: {
    padding: '0.3rem 0.85rem',
    backgroundColor: 'var(--accent-bg)',
    color: 'var(--accent)',
    borderRadius: '12px',
    fontSize: '0.85rem',
    fontWeight: '500',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  },
  species: {
    margin: '0 0 1rem 0',
    fontSize: '0.95rem',
    color: 'var(--text)',
  },
  tasksContainer: {
    marginTop: '1rem',
  },
  tasksTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: 'var(--text-h)',
  },
  noTasks: {
    margin: '0',
    fontSize: '0.9rem',
    color: 'var(--text)',
    fontStyle: 'italic',
  },
  tasksList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  taskItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border)',
    fontSize: '0.9rem',
  },
  taskAction: {
    fontWeight: '600',
    color: 'var(--accent)',
  },
  taskDue: {
    color: 'var(--text)',
  },
};
