import { renderHook, act, waitFor } from '@testing-library/react';

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
};

const mockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
};

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

import { useSearchHistory } from '@/hooks/useSearchHistory';

describe('useSearchHistory - removeResultByUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Expected removal', () => {
    it('removes one result from multi-result search', async () => {
      const mockSearchData = {
        id: 1,
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Yacht' },
          { url: 'boat2.jpg', user_short_description: 'Sailboat' },
          { url: 'boat3.jpg', user_short_description: 'Motorboat' },
        ],
      };

      // Mock fetch for single row
      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      // Mock update chain
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(1, 'boat2.jpg');
      });

      // Verify update was called with filtered results
      expect(mockSupabase.update).toHaveBeenCalledWith({
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Yacht' },
          { url: 'boat3.jpg', user_short_description: 'Motorboat' },
        ],
      });

      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });

    it('deletes whole search when removing last result', async () => {
      const mockSearchData = {
        id: 2,
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Only boat' },
        ],
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      // Mock delete chain - eq() is the final call that returns promise
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(2, 'boat1.jpg');
      });

      // Verify delete was called instead of update
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.update).not.toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 2);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUser.id);
    });
  });

  describe('{not_boat} edge case', () => {
    it('does nothing when search_results is not an array', async () => {
      const mockSearchData = {
        id: 3,
        search_results: { not_boat: 'This is not a boat image' },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(3, 'any-url.jpg');
      });

      // Should not call update or delete
      expect(mockSupabase.update).not.toHaveBeenCalled();
      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it('handles undefined urls in results array', async () => {
      const mockSearchData = {
        id: 4,
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Yacht' },
          { url: undefined, user_short_description: 'No URL' },
          { url: 'boat3.jpg', user_short_description: 'Motorboat' },
        ],
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(4, 'boat1.jpg');
      });

      // Should filter correctly, keeping only valid URLs except the removed one
      expect(mockSupabase.update).toHaveBeenCalledWith({
        search_results: [
          { url: 'boat3.jpg', user_short_description: 'Motorboat' },
        ],
      });
    });
  });

  describe('Supabase failure handling', () => {
    it('handles fetch error gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      // Mock fetchHistory to avoid errors
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(999, 'boat.jpg');
      });

      // Should not call update or delete on error
      expect(mockSupabase.update).not.toHaveBeenCalled();
      expect(mockSupabase.delete).not.toHaveBeenCalled();
    });

    it('refetches history on update error', async () => {
      const mockSearchData = {
        id: 5,
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Yacht' },
          { url: 'boat2.jpg', user_short_description: 'Sailboat' },
        ],
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      // Mock update to fail
      mockSupabase.update.mockResolvedValueOnce({
        error: { message: 'Update failed' },
      });

      // Mock refetch
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(5, 'boat1.jpg');
      });

      // Should attempt refetch after error
      await waitFor(() => {
        expect(mockSupabase.select).toHaveBeenCalled();
      });
    });

    it('handles delete error gracefully', async () => {
      const mockSearchData = {
        id: 6,
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Only boat' },
        ],
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      mockSupabase.delete.mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      // Mock refetch
      mockSupabase.select.mockReturnValueOnce(mockSupabase);
      mockSupabase.eq.mockReturnValueOnce(mockSupabase);
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      await act(async () => {
        await result.current.removeResultByUrl(6, 'boat1.jpg');
      });

      // Should attempt refetch after delete error
      await waitFor(() => {
        expect(mockSupabase.select).toHaveBeenCalled();
      });
    });
  });

  describe('Cache updates', () => {
    it('updates localStorage cache after successful removal', async () => {
      const mockSearchData = {
        id: 7,
        search_results: [
          { url: 'boat1.jpg', user_short_description: 'Yacht' },
          { url: 'boat2.jpg', user_short_description: 'Sailboat' },
        ],
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockSearchData,
        error: null,
      });

      mockSupabase.update.mockResolvedValueOnce({
        error: null,
      });

      const { result } = renderHook(() => useSearchHistory());

      // Simulate existing history in state
      await act(async () => {
        await result.current.removeResultByUrl(7, 'boat1.jpg');
      });

      // Cache should be updated (checked via localStorage)
      const cachedTime = localStorage.getItem(`search-history-time-${mockUser.id}`);
      expect(cachedTime).toBeTruthy();
    });
  });
});
