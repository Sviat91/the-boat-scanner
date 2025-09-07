import { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearchResult, setCurrentSearchResult] = useState<SearchResult | null>(null);
  const [notBoatMsg, setNotBoatMsg] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([]);

  const { saveSearchWithImage } = useSearchHistory();

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

    try {
      // Call search service
      const searchResponse = await searchImageWithWebhook(selectedFile);

      if (searchResponse.error) {
        throw new Error(searchResponse.error);
      }

      // Handle not_boat case
      if (searchResponse.not_boat) {
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
      if (user) {
        logger.debug('Saving search to history - success case', items);
        await saveSearchWithImage('Image Search', items, selectedFile);
      }

      const newResult: SearchResult = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user_image: previewUrl || '/placeholder.svg',
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

  return {
    isLoading,
    currentSearchResult,
    notBoatMsg,
    searchHistory,
    handleSearch,
    clearResults,
  };
}
