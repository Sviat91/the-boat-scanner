import { supabase } from '@/lib/supabase';

export interface Review {
  id: number;
  user_id: string;
  email: string;
  rating: number;
  review_text: string;
  bonus_credits_awarded: boolean;
  created_at: string;
}

export interface ReviewSubmitResponse {
  success: boolean;
  review_id?: number;
  bonus_result?: {
    awarded: boolean;
    bonus_amount?: number;
    new_free_credits?: number;
    total_credits?: number;
    reason?: string;
  };
  message: string;
  error?: string;
}

/**
 * Submit a new review
 */
export async function submitReview(
  rating: number,
  reviewText: string
): Promise<ReviewSubmitResponse> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        message: 'You must be logged in to submit a review',
        error: 'unauthorized',
      };
    }

    // Call Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-review`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          rating,
          review_text: reviewText,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to submit review',
        error: data.error || 'unknown_error',
      };
    }

    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    return {
      success: false,
      message: 'An unexpected error occurred',
      error: 'network_error',
    };
  }
}

/**
 * Check if user has already submitted a review
 */
export async function hasUserReviewed(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking review status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in hasUserReviewed:', error);
    return false;
  }
}

/**
 * Get user's review
 */
export async function getUserReview(): Promise<Review | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user review:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserReview:', error);
    return null;
  }
}

/**
 * Check if review bonus modal should be shown
 */
export async function shouldShowReviewModal(freeCredits: number): Promise<boolean> {
  try {
    // Only show if user has exactly 1 credit left
    if (freeCredits !== 1) return false;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Check if modal was already shown
    const { data, error } = await supabase
      .from('user_credits')
      .select('review_modal_shown')
      .eq('uid', user.id)
      .single();

    if (error || !data) return false;

    // Check if user already reviewed
    const hasReviewed = await hasUserReviewed();
    if (hasReviewed) return false;

    return !data.review_modal_shown;
  } catch (error) {
    console.error('Error checking modal status:', error);
    return false;
  }
}

/**
 * Mark review modal as shown
 */
export async function markModalAsShown(): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { error } = await supabase
      .from('user_credits')
      .update({ review_modal_shown: true })
      .eq('uid', user.id);

    if (error) {
      console.error('Error marking modal as shown:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markModalAsShown:', error);
    return false;
  }
}

/**
 * Get all reviews (for display)
 */
export async function getAllReviews(limit = 10): Promise<Review[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllReviews:', error);
    return [];
  }
}
