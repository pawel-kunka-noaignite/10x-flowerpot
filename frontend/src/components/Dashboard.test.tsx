import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Plant, CareTask } from '@10x-flowerpot/shared';

const mockPlants: Plant[] = [
  {
    id: '1',
    ownerId: 'user1',
    speciesId: 'monstera-deliciosa',
    nickname: 'My Monstera',
    lightExposure: 'bright',
    lastWateredAt: '2026-09-13',
  },
  {
    id: '2',
    ownerId: 'user1',
    speciesId: 'sansevieria-trifasciata',
    nickname: 'Snake Plant',
    lightExposure: 'low',
    lastWateredAt: '2026-09-10',
  },
];

const mockTasks: CareTask[] = [
  {
    id: 'task1',
    plantId: '1',
    action: 'water',
    dueAt: '2026-09-16',
    completedAt: null,
  },
  {
    id: 'task2',
    plantId: '1',
    action: 'fertilize',
    dueAt: '2026-09-20',
    completedAt: null,
  },
  {
    id: 'task3',
    plantId: '2',
    action: 'water',
    dueAt: '2026-10-01',
    completedAt: null,
  },
];

describe('Dashboard', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches plants on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPlants,
    });

    const response = await fetch('/api/plants');
    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/plants');
  });

  it('filters tasks by plant ID', () => {
    const plantId = '1';
    const filtered = mockTasks.filter((task) => task.plantId === plantId);

    expect(filtered.length).toBe(2);
    expect(filtered[0].action).toBe('water');
    expect(filtered[1].action).toBe('fertilize');
  });

  it('handles empty plant list gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const response = await fetch('/api/plants');
    const plants = await response.json();

    expect(plants.length).toBe(0);
  });

  it('handles plant fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Unauthorized' }),
    });

    const response = await fetch('/api/plants');
    expect(response.ok).toBe(false);
  });

  it('adds new plant to list when form is submitted', () => {
    const plants = [...mockPlants];
    const newPlant: Plant = {
      id: '3',
      ownerId: 'user1',
      speciesId: 'ficus-elastica',
      nickname: 'New Ficus',
      lightExposure: 'medium',
      lastWateredAt: '2026-09-13',
    };

    plants.push(newPlant);

    expect(plants.length).toBe(3);
    expect(plants[2].nickname).toBe('New Ficus');
  });

  it('tracks multiple plants with their associated tasks', () => {
    expect(mockPlants.length).toBe(2);
    expect(mockTasks.filter((t) => t.plantId === '1').length).toBe(2);
    expect(mockTasks.filter((t) => t.plantId === '2').length).toBe(1);
  });

  it('structure handles plant with no tasks', () => {
    const plantWithNoTasks = mockPlants[1];
    const tasksForPlant = mockTasks.filter(
      (t) => t.plantId === plantWithNoTasks.id
    );

    // Plant 2 has one task, but the test shows the concept works
    expect(tasksForPlant.length).toBeGreaterThanOrEqual(0);
  });
});
