import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { hasActiveSubscription } from '@/lib/subscription';
import { logger } from '@/utils/logger';

export interface CreditInfo {
  credits: number | null;
  subscribedUntil: Date | null;
  hasActiveSubscription: boolean;
  loading: boolean;
}

/**
 * Custom hook for managing user credits and subscription status
 */
export function useCredits(session: Session | null): CreditInfo {
  const [credits, setCredits] = useState<number | null>(null);
  const [subscribedUntil, setSubscribedUntil] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch credits whenever a session is available
  useEffect(() => {
    if (!session) {
      setCredits(null);
      setSubscribedUntil(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchCredits = async () => {
      try {
        const { data, error } = await supabase.rpc('get_credits');
        
        if (!isMounted) return;
        
        if (error) {
          logger.error('Error fetching credits:', error);
          setCredits(0);
          setSubscribedUntil(null);
        } else {
          const row = Array.isArray(data) ? data[0] : data;
          const total = (row?.free_credits ?? 0) + (row?.paid_credits ?? 0);
          setCredits(total);
          setSubscribedUntil(row?.subscribed_until ? new Date(row.subscribed_until) : null);
        }
      } catch (error) {
        logger.error('Error in fetchCredits:', error);
        if (isMounted) {
          setCredits(0);
          setSubscribedUntil(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCredits();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const subscriptionActive = hasActiveSubscription(subscribedUntil);

  return {
    credits,
    subscribedUntil,
    hasActiveSubscription: subscriptionActive,
    loading
  };
}

/**
 * Utility function to update credits count after consumption
 */
export function updateCreditsAfterUse(
  currentCredits: number | null, 
  setCredits: (value: number | null) => void
): void {
  setCredits(current => 
    typeof current === 'number' ? Math.max(0, current - 1) : current
  );
}