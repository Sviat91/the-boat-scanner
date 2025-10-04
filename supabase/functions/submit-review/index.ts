import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewRequest {
  rating: number;
  review_text: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client with user's JWT
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'You must be logged in to submit a review' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const { rating, review_text }: ReviewRequest = await req.json();

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Invalid rating', message: 'Rating must be between 1 and 5' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!review_text || review_text.trim().length < 20) {
      return new Response(
        JSON.stringify({
          error: 'Review too short',
          message: 'Review must be at least 20 characters long',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already submitted a review
    const { data: existingReview } = await supabaseClient
      .from('reviews')
      .select('id, bonus_credits_awarded')
      .eq('user_id', user.id)
      .single();

    if (existingReview) {
      return new Response(
        JSON.stringify({
          error: 'Already reviewed',
          message: 'You have already submitted a review',
          bonus_already_awarded: existingReview.bonus_credits_awarded,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert review
    const { data: review, error: insertError } = await supabaseClient
      .from('reviews')
      .insert({
        user_id: user.id,
        email: user.email,
        rating,
        review_text: review_text.trim(),
        bonus_credits_awarded: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return new Response(
        JSON.stringify({ error: 'Database error', message: 'Failed to save review' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Award bonus credits
    const { data: bonusResult, error: bonusError } = await supabaseClient.rpc('award_review_bonus', {
      review_user_id: user.id,
      review_email: user.email,
    });

    if (bonusError) {
      console.error('Error awarding bonus:', bonusError);
      // Review is saved, but bonus failed - log but don't fail the request
    }

    // Send to N8N webhook for analytics/notifications (fire and forget)
    const n8nWebhookUrl = Deno.env.get('VITE_N8N_WEBHOOK_URL_REVIEWS');
    const n8nSecretToken = Deno.env.get('VITE_N8N_SECRET_TOKEN_REVIEWS');
    
    if (n8nWebhookUrl) {
      const webhookHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add secret token to headers if configured
      if (n8nSecretToken) {
        webhookHeaders['Authorization'] = `Bearer ${n8nSecretToken}`;
      }
      
      fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: webhookHeaders,
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          rating,
          review_text: review_text.trim(),
          bonus_awarded: bonusResult?.awarded || false,
          new_credits: bonusResult?.new_free_credits || 0,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => console.error('N8N webhook error:', err));
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        review_id: review.id,
        bonus_result: bonusResult || { awarded: false, reason: 'bonus_error' },
        message: bonusResult?.awarded
          ? 'Thank you for your review! 3 bonus credits have been added to your account.'
          : 'Thank you for your review!',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
