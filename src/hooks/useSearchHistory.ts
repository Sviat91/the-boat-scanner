import { useCallback, useEffect, useState } from 'react';
import Compressor from 'compressorjs';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Match } from '@/components/HistoryCard';
import { getSafeFilePath } from '@/utils/getSafeFilePath';
import { logger } from '@/utils/logger';

export type SearchResults = Match[] | { not_boat: string };

export interface SearchHistoryItem {
  id: number;
  search_query: string;
  search_results: SearchResults;
  user_image_url?: string;
  created_at: string;
}

export const useSearchHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      logger.debug('No user, skipping history fetch');
      return;
    }

    setLoading(true);
    try {
      logger.debug('Fetching search history for user:', user.id);
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching search history:', error);
        throw error;
      }

      logger.debug('Fetched search history:', data);
      setHistory(data || []);
    } catch (error) {
      logger.error('Error fetching search history:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const compressImage = (imageFile: File) => {
    return new Promise<Blob>((resolve, reject) => {
      new Compressor(imageFile, {
        quality: 0.9,
        maxWidth: 600,
        success: result => resolve(result as Blob),
        error: err => reject(err),
      });
    });
  };

  const saveSearchWithImage = async (
    query: string,
    results: SearchResults,
    imageFile: File
  ): Promise<string | undefined> => {
    if (!user) {
      logger.debug('No user, skipping search save');
      return;
    }

    try {
      const compressed = await compressImage(imageFile);
      const key = getSafeFilePath(imageFile, user.id);
      const { error: uploadError } = await supabase.storage
        .from('search-images')
        .upload(key, compressed);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('search-images').getPublicUrl(key);
      await saveSearch(query, results, data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      logger.error('Error saving search with image:', error);
    }
  };

  const saveSearch = async (query: string, results: SearchResults, userImageUrl?: string) => {
    if (!user) {
      logger.debug('No user, skipping search save');
      return;
    }

    try {
      logger.debug('Saving search to history:', { query, results, userImageUrl, userId: user.id });

      const { data, error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_query: query,
          search_results: results,
          user_image_url: userImageUrl,
        })
        .select();

      if (error) {
        logger.error('Error saving search:', error);
        throw error;
      }

      logger.debug('Search saved successfully:', data);

      // Refresh history after saving
      await fetchHistory();
    } catch (error) {
      logger.error('Error saving search:', error);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      logger.debug('Clearing search history for user:', user.id);
      const { error } = await supabase.from('search_history').delete().eq('user_id', user.id);

      if (error) throw error;
      setHistory([]);
      logger.debug('Search history cleared successfully');
    } catch (error) {
      logger.error('Error clearing history:', error);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    if (!user) return;

    try {
      logger.debug('Deleting search history item:', id);
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
      logger.debug('Search history item deleted successfully');
    } catch (error) {
      logger.error('Error deleting history item:', error);
    }
  };

  // Alias for semantic clarity in UI when clearing a single search's results
  const clearResultsForSearch = async (id: number) => {
    await deleteHistoryItem(id);
  };

  // Remove a single match from a specific saved search by URL.
  // If the search becomes empty after removal, the whole row is deleted.
  const removeResultByUrl = async (searchId: number, url: string) => {
    if (!user || !url) return;
    try {
      // Fetch current row to ensure server source of truth
      const { data, error } = await supabase
        .from('search_history')
        .select('id, search_results')
        .eq('id', searchId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      const row = data as { id: number; search_results: SearchResults } | null;
      if (!row) return;

      // Only arrays are supported for per-ad deletion
      if (!Array.isArray(row.search_results)) {
        logger.debug('removeResultByUrl: search_results is not an array, skipping');
        return;
      }

      // Filter out by url; ignore undefined urls
      const next = row.search_results.filter(m => (m as any)?.url && (m as any).url !== url);

      if (next.length === 0) {
        // Delete whole search if now empty
        const { error: delErr } = await supabase
          .from('search_history')
          .delete()
          .eq('id', searchId)
          .eq('user_id', user.id);
        if (delErr) throw delErr;
        setHistory(prev => prev.filter(i => i.id !== searchId));
        return;
      }

      // Update the row with remaining results
      const { error: updErr } = await supabase
        .from('search_history')
        .update({ search_results: next })
        .eq('id', searchId)
        .eq('user_id', user.id);
      if (updErr) throw updErr;

      // Optimistically update local state
      setHistory(prev => prev.map(i => (i.id === searchId ? { ...i, search_results: next } : i)));
    } catch (error) {
      logger.error('Error removing result from search:', error);
      // Fallback to refetch in case of inconsistency
      await fetchHistory();
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setHistory([]);
    }
  }, [user, fetchHistory]);

  return {
    history,
    loading,
    saveSearch,
    saveSearchWithImage,
    clearHistory,
    deleteHistoryItem,
    clearResultsForSearch,
    removeResultByUrl,
    refetchHistory: fetchHistory,
  };
};
