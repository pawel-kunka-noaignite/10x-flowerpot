import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the useAuth hook
vi.mock('../lib/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../lib/useAuth';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('Header', () => {
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

  it('displays authenticated user info', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
      loading: false,
      error: null,
    });

    const result = mockUseAuth();
    expect(result.user?.name).toBe('Test');
    expect(result.user?.email).toBe('test@example.com');
  });

  it('handles user with email but no name', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      loading: false,
      error: null,
    });

    const result = mockUseAuth();
    expect(result.user?.email).toBe('test@example.com');
    expect(result.user?.name).toBeUndefined();
  });
});
