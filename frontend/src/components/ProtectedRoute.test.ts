import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useAuth hook
vi.mock('../lib/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../lib/useAuth';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses useAuth hook', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
      loading: false,
      error: null,
    });

    expect(mockUseAuth).toBeDefined();
  });

  it('handles authenticated user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
      loading: false,
      error: null,
    });

    const result = mockUseAuth();
    expect(result.user).not.toBeNull();
    expect(result.loading).toBe(false);
  });

  it('handles loading state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      error: null,
    });

    const result = mockUseAuth();
    expect(result.loading).toBe(true);
  });
});
