
import { useState, useEffect, useCallback } from 'react'
import Compressor from 'compressorjs'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Match } from '@/components/HistoryCard'
import { getSafeFilePath } from '@/utils/getSafeFilePath'

export type SearchResults = Match[] | { not_boat: string }

export interface SearchHistoryItem {
  id: number
  search_query: string
  search_results: SearchResults
  user_image_url?: string
  created_at: string
}

export const useSearchHistory = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping history fetch')
      return
    }

    setLoading(true)
    try {
      console.log('Fetching search history for user:', user.id)
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching search history:', error)
        throw error
      }
      
      console.log('Fetched search history:', data)
      setHistory(data || [])
    } catch (error) {
      console.error('Error fetching search history:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const compressImage = (imageFile: File) => {
    return new Promise<Blob>((resolve, reject) => {
      new Compressor(imageFile, {
        quality: 0.9,
        maxWidth: 600,
        success: (result) => resolve(result as Blob),
        error: (err) => reject(err)
      })
    })
  }

  const saveSearchWithImage = async (
    query: string,
    results: SearchResults,
    imageFile: File
  ) => {
    if (!user) {
      console.log('No user, skipping search save')
      return
    }

    try {
      const compressed = await compressImage(imageFile)
      const key = getSafeFilePath(imageFile, user.id)
      const { error: uploadError } = await supabase.storage
        .from('search-images')
        .upload(key, compressed)

      if (uploadError) throw uploadError

      const { data } = supabase
        .storage.from('search-images')
        .getPublicUrl(key)
      await saveSearch(query, results, data.publicUrl)
    } catch (error) {
      console.error('Error saving search with image:', error)
    }
  }

  const saveSearch = async (
    query: string,
    results: SearchResults,
    userImageUrl?: string
  ) => {
    if (!user) {
      console.log('No user, skipping search save')
      return
    }

    try {
      console.log('Saving search to history:', { query, results, userImageUrl, userId: user.id })

      const { data, error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_query: query,
          search_results: results,
          user_image_url: userImageUrl
        })
        .select()

      if (error) {
        console.error('Error saving search:', error)
        throw error
      }
      
      console.log('Search saved successfully:', data)
      
      // Refresh history after saving
      await fetchHistory()
    } catch (error) {
      console.error('Error saving search:', error)
    }
  }

  const clearHistory = async () => {
    if (!user) return

    try {
      console.log('Clearing search history for user:', user.id)
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
      setHistory([])
      console.log('Search history cleared successfully')
    } catch (error) {
      console.error('Error clearing history:', error)
    }
  }

  const deleteHistoryItem = async (id: number) => {
    if (!user) return

    try {
      console.log('Deleting search history item:', id)
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      setHistory(prev => prev.filter(item => item.id !== id))
      console.log('Search history item deleted successfully')
    } catch (error) {
      console.error('Error deleting history item:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchHistory()
    } else {
      setHistory([])
    }
  }, [user, fetchHistory])

  return {
    history,
    loading,
    saveSearch,
    saveSearchWithImage,
    clearHistory,
    deleteHistoryItem,
    refetchHistory: fetchHistory
  }
}
