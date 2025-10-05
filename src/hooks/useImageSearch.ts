import { useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { searchImageWithWebhook } from '@/services/searchService';
import { Match } from '@/components/HistoryCard';
import { logger } from '@/utils/logger';

export interface SearchResult {
  id: string;
  timestamp: string;
  user_image: string;
  results: Match[];
}

export interface UseImageSearchProps {
  user: User | null;
  credits: number | null;
  hasActiveSubscription: boolean;
  updateCredits: (credits: number | null) => void;
}

export function useImageSearch({
  user,
  credits,
  hasActiveSubscription,
  updateCredits,
}: UseImageSearchProps) {
  const SESSION_KEY = 'index:lastSearch';
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearchResult, setCurrentSearchResult] = useState<SearchResult | null>(null);
  const [notBoatMsg, setNotBoatMsg] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  const { saveSearchWithImage } = useSearchHistory();

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });

  const handleSearch = async (selectedFile: File, previewUrl: string | null) => {
    // Check credits/subscription
    if (!hasActiveSubscription && credits === 0) {
      toast({
        title: 'No credits remaining',
        description: 'Please purchase more credits to continue searching.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    // Clear stored last search on new search start
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_e) {
      /* ignore */
    }

    try {
      // Call search service
      const searchResponse = await searchImageWithWebhook(selectedFile);

      if (searchResponse.error) {
        throw new Error(searchResponse.error);
      }

      // Handle not_boat case (string message expected)
      if (typeof searchResponse.not_boat === 'string' && searchResponse.not_boat) {
        setNotBoatMsg(searchResponse.not_boat);
        setCurrentSearchResult(null);

        // Save to search history if user is authenticated
        if (user) {
          logger.debug('Saving search to history - not_boat case');
          await saveSearchWithImage(
            'Image Search',
            { not_boat: searchResponse.not_boat },
            selectedFile
          );
        }

        toast({
          title: 'Image processed',
          description: 'Please check the message below.',
          variant: 'destructive',
        });
        return;
      }

      // Handle success case
      const items = searchResponse.results || [];
      setNotBoatMsg('');

      // Save to search history if user is authenticated
      let uploadedUrl: string | undefined;
      if (user) {
        logger.debug('Saving search to history - success case', items);
        uploadedUrl = await saveSearchWithImage('Image Search', items, selectedFile);
      }

      const userImage =
        uploadedUrl ||
        (previewUrl?.startsWith('blob:') ? await fileToDataUrl(selectedFile) : previewUrl) ||
        '/placeholder.svg';

      const newResult: SearchResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user_image: userImage,
        results:
          items.length > 0
            ? items
            : [
                {
                  url: '',
                  user_short_description: 'No results found.',
                },
              ],
      };

      setCurrentSearchResult(newResult);

      // Only add to local state if user is not authenticated (for temporary display)
      if (!user) {
        setSearchHistory(prev => [newResult, ...prev]);
      }

      // Sync credits from server after successful search when not subscribed
      if (!hasActiveSubscription && user) {
        try {
          const { data, error } = await supabase.rpc('get_credits');
          if (error) {
            logger.error('Error refreshing credits after search:', error);
          } else {
            const row = Array.isArray(data) ? data[0] : data;
            const total = (row?.free_credits ?? 0) + (row?.paid_credits ?? 0);
            updateCredits(total);
          }
        } catch (e) {
          logger.error('Unexpected error refreshing credits:', e);
        }
      }

      toast({
        title: 'Search completed!',
        description: 'Your image has been processed successfully.',
      });
    } catch (error) {
      logger.error('Error in image search:', error);
      toast({
        title: 'Search failed',
        description: 'Unable to process your image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setCurrentSearchResult(null);
    setNotBoatMsg('');
  };

  // Restore from sessionStorage on first mount if state empty
  // BUT clear if page was reloaded (F5) vs navigated to
  useEffect(() => {
    if (currentSearchResult || notBoatMsg) return;

    // Check if page was hard-reloaded (F5 or browser refresh)
    // Use a flag in sessionStorage to detect actual reload
    const RELOAD_FLAG_KEY = 'index:isReload';
    const wasReloaded = sessionStorage.getItem(RELOAD_FLAG_KEY) === 'true';

    if (wasReloaded) {
      // Clear on page reload
      try {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(RELOAD_FLAG_KEY);
      } catch (_e) {
        /* ignore */
      }
      return;
    }

    // Otherwise restore from sessionStorage (normal navigation)
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        currentSearchResult: SearchResult | null;
        notBoatMsg: string;
      };
      if (parsed?.currentSearchResult) setCurrentSearchResult(parsed.currentSearchResult);
      if (parsed?.notBoatMsg) setNotBoatMsg(parsed.notBoatMsg);
    } catch (_e) {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist latest state to sessionStorage
  useEffect(() => {
    try {
      if (currentSearchResult || notBoatMsg) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ currentSearchResult, notBoatMsg }));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (_e) {
      /* ignore */
    }
  }, [currentSearchResult, notBoatMsg]);

  // Set flag on page unload to detect reload on next mount
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        sessionStorage.setItem('index:isReload', 'true');
      } catch (_e) {
        /* ignore */
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Clear on sign-out (transition from signed-in to signed-out)
  const prevUserId = useRef<string | null>(user?.id ?? null);
  useEffect(() => {
    const was = prevUserId.current;
    const now = user?.id ?? null;
    if (was && !now) {
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch (_e) {
        /* ignore */
      }
      setCurrentSearchResult(null);
      setNotBoatMsg('');
    }
    prevUserId.current = now;
  }, [user]);

  return {
    isLoading,
    currentSearchResult,
    notBoatMsg,
    searchHistory,
    handleSearch,
    clearResults,
  };
}
