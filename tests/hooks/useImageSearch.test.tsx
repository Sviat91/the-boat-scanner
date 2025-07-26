import { renderHook, act, waitFor } from '@testing-library/react';

const mockToast = jest.fn();
const mockSaveSearchWithImage = jest.fn();
const mockSearchImageWithWebhook = jest.fn();

const mockSupabase = {
  rpc: jest.fn()
};

jest.mock('@/hooks/use-toast', () => ({
  toast: (...args: any[]) => mockToast(...args)
}));

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

jest.mock('@/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    saveSearchWithImage: mockSaveSearchWithImage
  })
}));

jest.mock('@/services/searchService', () => ({
  searchImageWithWebhook: mockSearchImageWithWebhook
}));

import { useImageSearch } from '@/hooks/useImageSearch';

const mockUser = {
  id: '123',
  email: 'test@example.com'
};

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

describe('useImageSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credit validation', () => {
    it('prevents search when no credits and no subscription', async () => {
      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 0,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'No credits remaining',
        description: 'Please purchase more credits to continue searching.',
        variant: 'destructive',
      });

      expect(mockSearchImageWithWebhook).not.toHaveBeenCalled();
    });

    it('allows search with active subscription', async () => {
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [{ url: 'test-url', user_short_description: 'Test boat' }]
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 0,
        hasActiveSubscription: true,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockSearchImageWithWebhook).toHaveBeenCalledWith(mockFile);
    });

    it('allows search with available credits', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [{ url: 'test-url', user_short_description: 'Test boat' }]
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_credit');
      expect(mockSearchImageWithWebhook).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('Credit consumption', () => {
    it('consumes credits when not on subscription', async () => {
      mockSupabase.rpc
        .mockResolvedValueOnce({ data: true, error: null }) // consume_credit
        .mockResolvedValueOnce({ data: true, error: null }); // decrement_credits
      
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [{ url: 'test-url', user_short_description: 'Test boat' }]
      });

      const mockUpdateCredits = jest.fn();
      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: mockUpdateCredits
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('consume_credit');
      expect(mockUpdateCredits).toHaveBeenCalledWith(2);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_credits');
    });

    it('does not consume credits with active subscription', async () => {
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [{ url: 'test-url', user_short_description: 'Test boat' }]
      });

      const mockUpdateCredits = jest.fn();
      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: true,
        updateCredits: mockUpdateCredits
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockSupabase.rpc).not.toHaveBeenCalledWith('consume_credit');
      expect(mockUpdateCredits).not.toHaveBeenCalled();
    });

    it('handles credit consumption failure', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: false, error: null });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Out of credits',
        description: 'Buy credits to continue',
        variant: 'destructive'
      });

      expect(mockSearchImageWithWebhook).not.toHaveBeenCalled();
    });
  });

  describe('Search results handling', () => {
    it('handles successful search results', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [
          { url: 'boat1.jpg', user_short_description: 'Yacht for sale' },
          { url: 'boat2.jpg', user_short_description: 'Sailboat listing' }
        ]
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      await waitFor(() => {
        expect(result.current.currentSearchResult).toMatchObject({
          user_image: 'preview-url',
          results: [
            { url: 'boat1.jpg', user_short_description: 'Yacht for sale' },
            { url: 'boat2.jpg', user_short_description: 'Sailboat listing' }
          ]
        });
      });

      expect(mockSaveSearchWithImage).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith({
        title: "Search completed!",
        description: "Your image has been processed successfully.",
      });
    });

    it('handles not_boat response', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockResolvedValue({
        not_boat: "This doesn't appear to be a boat image"
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      await waitFor(() => {
        expect(result.current.notBoatMsg).toBe("This doesn't appear to be a boat image");
        expect(result.current.currentSearchResult).toBe(null);
      });

      expect(mockSaveSearchWithImage).toHaveBeenCalledWith(
        'Image Search',
        { not_boat: "This doesn't appear to be a boat image" },
        mockFile
      );
    });

    it('handles empty results', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockResolvedValue({
        results: []
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      await waitFor(() => {
        expect(result.current.currentSearchResult?.results).toEqual([{
          url: '',
          user_short_description: 'No results found.'
        }]);
      });
    });
  });

  describe('Error handling', () => {
    it('handles search service errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockResolvedValue({
        error: 'Service unavailable'
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Search failed",
        description: "Unable to process your image. Please try again.",
        variant: "destructive"
      });
    });

    it('handles network errors', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: "Search failed",
        description: "Unable to process your image. Please try again.",
        variant: "destructive"
      });
    });
  });

  describe('Loading state', () => {
    it('manages loading state correctly', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve;
      });
      mockSearchImageWithWebhook.mockReturnValue(searchPromise);

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSearch!({ results: [] });
        await searchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('User state handling', () => {
    it('saves search history for authenticated users', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: true, error: null });
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [{ url: 'test.jpg', user_short_description: 'Test boat' }]
      });

      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(mockSaveSearchWithImage).toHaveBeenCalledWith(
        'Image Search',
        [{ url: 'test.jpg', user_short_description: 'Test boat' }],
        mockFile
      );
    });

    it('adds to local history for non-authenticated users', async () => {
      mockSearchImageWithWebhook.mockResolvedValue({
        results: [{ url: 'test.jpg', user_short_description: 'Test boat' }]
      });

      const { result } = renderHook(() => useImageSearch({
        user: null,
        credits: null,
        hasActiveSubscription: true, // Free trial
        updateCredits: jest.fn()
      }));

      await act(async () => {
        await result.current.handleSearch(mockFile, 'preview-url');
      });

      expect(result.current.searchHistory).toHaveLength(1);
      expect(mockSaveSearchWithImage).not.toHaveBeenCalled();
    });
  });

  describe('Clear results', () => {
    it('clears search results and messages', async () => {
      const { result } = renderHook(() => useImageSearch({
        user: mockUser,
        credits: 3,
        hasActiveSubscription: false,
        updateCredits: jest.fn()
      }));

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.currentSearchResult).toBe(null);
      expect(result.current.notBoatMsg).toBe('');
    });
  });
});