import { renderHook, waitFor } from '@testing-library/react';

const mockSupabase = {
  rpc: jest.fn()
};

const mockHasActiveSubscription = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

jest.mock('@/lib/subscription', () => ({
  hasActiveSubscription: mockHasActiveSubscription
}));

import { useCredits, updateCreditsAfterUse } from '@/hooks/useCredits';

const mockSession = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '123',
    email: 'test@example.com'
  }
};

describe('useCredits', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasActiveSubscription.mockReturnValue(false);
  });

  describe('Session handling', () => {
    it('returns null values when no session', async () => {
      const { result } = renderHook(() => useCredits(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.credits).toBe(null);
      expect(result.current.subscribedUntil).toBe(null);
      expect(result.current.hasActiveSubscription).toBe(false);
    });

    it('fetches credits when session exists', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          free_credits: 3,
          paid_credits: 2,
          subscribed_until: null
        },
        error: null
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_credits');
      expect(result.current.credits).toBe(5);
    });
  });

  describe('Credit calculation', () => {
    it('correctly sums free and paid credits', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          free_credits: 3,
          paid_credits: 7,
          subscribed_until: null
        },
        error: null
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.credits).toBe(10);
      });
    });

    it('handles missing credit values', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          free_credits: null,
          paid_credits: 5,
          subscribed_until: null
        },
        error: null
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.credits).toBe(5);
      });
    });

    it('handles array response format', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [{
          free_credits: 2,
          paid_credits: 3,
          subscribed_until: null
        }],
        error: null
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.credits).toBe(5);
      });
    });
  });

  describe('Subscription handling', () => {
    it('parses subscription date correctly', async () => {
      const futureDate = '2024-12-31T23:59:59Z';
      
      mockSupabase.rpc.mockResolvedValue({
        data: {
          free_credits: 3,
          paid_credits: 2,
          subscribed_until: futureDate
        },
        error: null
      });

      mockHasActiveSubscription.mockReturnValue(true);

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.subscribedUntil).toEqual(new Date(futureDate));
        expect(result.current.hasActiveSubscription).toBe(true);
      });
    });

    it('handles null subscription date', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: {
          free_credits: 3,
          paid_credits: 2,
          subscribed_until: null
        },
        error: null
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.subscribedUntil).toBe(null);
        expect(result.current.hasActiveSubscription).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('handles RPC errors gracefully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'RPC error' }
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.credits).toBe(0);
      expect(result.current.subscribedUntil).toBe(null);
    });

    it('handles network errors', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.credits).toBe(0);
      expect(result.current.subscribedUntil).toBe(null);
    });
  });

  describe('Loading state', () => {
    it('starts with loading true', () => {
      mockSupabase.rpc.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useCredits(mockSession));

      expect(result.current.loading).toBe(true);
    });

    it('sets loading false after fetch completes', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: { free_credits: 3, paid_credits: 2 },
        error: null
      });

      const { result } = renderHook(() => useCredits(mockSession));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });
});

describe('updateCreditsAfterUse', () => {
  it('decrements credits by 1', () => {
    const mockSetCredits = jest.fn();
    
    updateCreditsAfterUse(5, mockSetCredits);
    
    expect(mockSetCredits).toHaveBeenCalledWith(expect.any(Function));
    
    const updateFunction = mockSetCredits.mock.calls[0][0];
    expect(updateFunction(5)).toBe(4);
  });

  it('does not go below zero', () => {
    const mockSetCredits = jest.fn();
    
    updateCreditsAfterUse(0, mockSetCredits);
    
    const updateFunction = mockSetCredits.mock.calls[0][0];
    expect(updateFunction(0)).toBe(0);
  });

  it('handles null credits', () => {
    const mockSetCredits = jest.fn();
    
    updateCreditsAfterUse(null, mockSetCredits);
    
    const updateFunction = mockSetCredits.mock.calls[0][0];
    expect(updateFunction(null)).toBe(null);
  });

  it('handles non-number values', () => {
    const mockSetCredits = jest.fn();
    
    updateCreditsAfterUse(5, mockSetCredits);
    
    const updateFunction = mockSetCredits.mock.calls[0][0];
    expect(updateFunction('invalid')).toBe('invalid');
  });
});