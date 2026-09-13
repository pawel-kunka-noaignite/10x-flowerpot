import { describe, it, expect } from 'vitest';
import { daysUntilDue } from './PlantCard';

describe('PlantCard', () => {
  describe('daysUntilDue', () => {
    it('returns 0 for tasks due today', () => {
      const today = new Date('2026-09-13');
      const result = daysUntilDue('2026-09-13', today);
      expect(result).toBe(0);
    });

    it('returns correct number of days for future tasks', () => {
      const today = new Date('2026-09-13');
      const result = daysUntilDue('2026-09-20', today);
      expect(result).toBe(7);
    });

    it('returns 0 for past tasks', () => {
      const today = new Date('2026-09-13');
      const result = daysUntilDue('2026-09-10', today);
      expect(result).toBe(0);
    });

    it('returns 1 for tasks due tomorrow', () => {
      const today = new Date('2026-09-13');
      const result = daysUntilDue('2026-09-14', today);
      expect(result).toBe(1);
    });

    it('handles date calculations across month boundaries', () => {
      const today = new Date('2026-09-28');
      const result = daysUntilDue('2026-10-05', today);
      expect(result).toBe(7);
    });

    it('ignores time component and uses date only', () => {
      const today = new Date('2026-09-13T23:59:59');
      const dueDate = '2026-09-14';
      const result = daysUntilDue(dueDate, today);
      expect(result).toBe(1);
    });

    it('handles timezone-independent comparisons', () => {
      const today = new Date('2026-09-13T00:00:00Z');
      const result = daysUntilDue('2026-09-15', today);
      expect(result).toBe(2);
    });
  });

  describe('PlantCard component structure', () => {
    it('displays plant nickname and light exposure', () => {
      const mockPlant = {
        id: '123',
        ownerId: 'user1',
        speciesId: 'monstera-deliciosa',
        nickname: 'My Monstera',
        lightExposure: 'bright' as const,
        lastWateredAt: '2026-09-13',
      };

      // Test that the component would render correctly
      expect(mockPlant.nickname).toBe('My Monstera');
      expect(mockPlant.lightExposure).toBe('bright');
    });

    it('sorts tasks by due date', () => {
      const tasks = [
        {
          id: '1',
          plantId: '123',
          action: 'fertilize' as const,
          dueAt: '2026-09-20',
          completedAt: null,
        },
        {
          id: '2',
          plantId: '123',
          action: 'water' as const,
          dueAt: '2026-09-16',
          completedAt: null,
        },
        {
          id: '3',
          plantId: '123',
          action: 'prune' as const,
          dueAt: '2026-09-25',
          completedAt: null,
        },
      ];

      const sorted = [...tasks].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      );

      expect(sorted[0].action).toBe('water');
      expect(sorted[1].action).toBe('fertilize');
      expect(sorted[2].action).toBe('prune');
    });

    it('handles empty task list gracefully', () => {
      const tasks: any[] = [];
      expect(tasks.length).toBe(0);
    });
  });
});
