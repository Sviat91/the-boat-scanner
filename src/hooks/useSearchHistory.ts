
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface SearchHistoryItem {
  id: number
  search_query: string
  search_results: any
  user_image_url?: string
  created_at: string
}

export const useSearchHistory = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = async () => {
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
  }

  const saveSearch = async (query: string, results: any, userImageUrl?: string) => {
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
  }, [user])

  return {
    history,
    loading,
    saveSearch,
    clearHistory,
    deleteHistoryItem,
    refetchHistory: fetchHistory
  }
}
