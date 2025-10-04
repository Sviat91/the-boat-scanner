import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { normalizeNotBoat, isNotBoat } from './notBoat.ts';

// Env vars to configure
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// External webhook (N8N) that performs the search
const N8N_WEBHOOK_URL = Deno.env.get('N8N_WEBHOOK_URL');
const N8N_SECRET_TOKEN = Deno.env.get('N8N_SECRET_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Normalize image field names from n8n output to frontend expected format
 * Maps: photos_link_front_html -> user_images_html
 */
function normalizeImageFields(item: any): any {
  if (!item || typeof item !== 'object') return item;

  // photos_link_front_html → user_images_html
  if (item.photos_link_front_html && !item.user_images_html) {
    item.user_images_html = item.photos_link_front_html;
  }

  // Also support old field name photos_link_front
  if (item.photos_link_front && !item.user_images_html) {
    item.user_images_html = item.photos_link_front;
  }

  // user_image_urls (array) → thumbnail (first element)
  if (item.user_image_urls && Array.isArray(item.user_image_urls) && item.user_image_urls.length > 0 && !item.thumbnail) {
    item.thumbnail = item.user_image_urls[0];
  }

  // Extract thumbnail from photos_link_front_html or photos_link_front if present
  const photoField = item.photos_link_front_html || item.photos_link_front;
  if (photoField && typeof photoField === 'string' && !item.thumbnail) {
    // Try to extract src from <img src="..." /> tag
    const srcMatch = photoField.match(/src=["']([^"']+)["']/);
    if (srcMatch && srcMatch[1]) {
      item.thumbnail = srcMatch[1];
    } else {
      // Fallback: try pipe-separated URLs
      const urls = photoField.split('|').map((u: string) => u.trim()).filter(Boolean);
      if (urls.length > 0) {
        item.thumbnail = urls[0];
      }
    }
  }

  return item;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    if (!N8N_WEBHOOK_URL) {
      console.error('Missing N8N_WEBHOOK_URL');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create Supabase client bound to the caller's JWT
    const authHeader = req.headers.get('Authorization') ?? '';
    const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Extract the uploaded image (FormData key: 'photo')
    const formData = await req.formData();
    const file = formData.get('photo');
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Missing photo file' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Forward to N8N webhook
    const forward = new FormData();
    forward.append('photo', file);

    const n8nResp = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        ...(N8N_SECRET_TOKEN ? { 'x-secret-token': N8N_SECRET_TOKEN } : {}),
      },
      body: forward,
    });

    if (!n8nResp.ok) {
      const text = await n8nResp.text();
      console.error('N8N webhook error:', n8nResp.status, text);
      return new Response(JSON.stringify({ error: 'Search upstream failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const raw = await n8nResp.text();
    let payload: any = null;
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = { raw };
    }

    console.log('Raw payload from n8n:', JSON.stringify(payload, null, 2));

    payload = normalizeNotBoat(payload);

    // Normalize image fields from n8n format to frontend format
    if (Array.isArray(payload)) {
      console.log('Processing array payload, items:', payload.length);
      payload = payload.map(normalizeImageFields);
    } else if (payload && typeof payload === 'object' && Array.isArray(payload.body)) {
      console.log('Processing body array, items:', payload.body.length);
      payload.body = payload.body.map(normalizeImageFields);
    } else if (payload && typeof payload === 'object') {
      console.log('Processing single object payload');
      payload = normalizeImageFields(payload);
    }

    console.log('Normalized payload:', JSON.stringify(payload, null, 2));

    // Atomically decrement credits on success for authenticated, non-subscribed users
    try {
      const { data: userRes } = await sbUser.auth.getUser();
      const user = userRes?.user ?? null;
      const chargeable = n8nResp.status === 200 && !isNotBoat(payload) && !(payload?.error || payload?.errors);

      if (user && chargeable) {
        const { data: creditsData, error: getErr } = await sbUser.rpc('get_credits');
        if (getErr) {
          console.error('get_credits error:', getErr);
        } else {
          const row = Array.isArray(creditsData) ? creditsData[0] : creditsData;
          const subscribedUntil = row?.subscribed_until ? new Date(row.subscribed_until) : null;
          const hasSubscription = !!subscribedUntil && subscribedUntil.getTime() > Date.now();

          if (!hasSubscription) {
            const { error: decErr } = await sbUser.rpc('decrement_credits');
            if (decErr) console.error('decrement_credits error:', decErr);
          }
        }
      }
    } catch (e) {
      console.error('Credit update block failed:', e);
    }

    return new Response(JSON.stringify(payload ?? {}), {
      status: n8nResp.status,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    console.error('proxy-n8n-webhook unexpected error:', err);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

