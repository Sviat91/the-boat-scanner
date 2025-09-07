import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

function isSuccessPayload(data: unknown): boolean {
  // Mirrors client-side processWebhookResponse decision logic
  if (Array.isArray(data)) return true; // success list
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if ('not_boat' in obj) return false;
    if (Array.isArray(obj.body)) {
      const body = obj.body as any[];
      if (body?.[0]?.not_boat) return false;
      return true;
    }
  }
  return false; // default to non-success if unknown
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

    const payload = await n8nResp.json();

    // Atomically decrement credits on success for authenticated, non-subscribed users
    try {
      const { data: userRes } = await sbUser.auth.getUser();
      const user = userRes?.user ?? null;

      if (user && isSuccessPayload(payload)) {
        // Check subscription status via RPC get_credits
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
      // We still return the search payload; credits sync will be retried client-side via get_credits
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
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

