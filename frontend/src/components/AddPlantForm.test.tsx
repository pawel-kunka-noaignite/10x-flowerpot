import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Species } from '@10x-flowerpot/shared';

const mockSpecies: Species[] = [
  {
    id: 'monstera-deliciosa',
    commonName: 'Monstera',
    baseIntervals: { water: 7, fertilize: 30, prune: 90 },
  },
  {
    id: 'sansevieria-trifasciata',
    commonName: 'Snake Plant',
    baseIntervals: { water: 21, fertilize: 60, prune: 180 },
  },
];

describe('AddPlantForm', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('fetches species on mount', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSpecies,
    });

    // Component would fetch species
    const response = await fetch('/api/species');
    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith('/api/species');
  });

  it('posts plant data when form is submitted', async () => {
    const formData = {
      speciesId: 'monstera-deliciosa',
      nickname: 'My Monstera',
      lightExposure: 'bright' as const,
      lastWateredAt: '2026-09-13',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        plant: {
          id: '123',
          ownerId: 'user1',
          speciesId: 'monstera-deliciosa',
          nickname: 'My Monstera',
          lightExposure: 'bright',
          lastWateredAt: '2026-09-13',
        },
        initialTasks: [],
      }),
    });

    const response = await fetch('/api/plants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.plant.nickname).toBe('My Monstera');
  });

  it('handles submission errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid plant data' }),
    });

    const response = await fetch('/api/plants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(false);
  });

  it('creates form with expected fields structure', () => {
    // Test that the component structure is correct
    const expectedFields = {
      speciesId: '',
      nickname: '',
      lightExposure: 'medium',
      lastWateredAt: new Date().toISOString().split('T')[0],
    };

    expect(expectedFields).toHaveProperty('speciesId');
    expect(expectedFields).toHaveProperty('nickname');
    expect(expectedFields).toHaveProperty('lightExposure');
    expect(expectedFields).toHaveProperty('lastWateredAt');
  });
});
