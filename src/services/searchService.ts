import { Match } from '@/components/HistoryCard';
import { logger } from '@/utils/logger';
import { supabase } from '@/lib/supabase';

export interface SearchResponse {
  results?: Match[];
  // UI expects message text when image is not a boat
  not_boat?: string;
  error?: string;
}

export interface NotBoatResponse {
  not_boat: string;
}

export interface SuccessResponse {
  results: Match[];
}

/**
 * Process N8N webhook response and normalize it
 */
export function processWebhookResponse(data: unknown): SearchResponse {
  const DEFAULT_NB =
    "Oops! 🚫 The uploaded image doesn't seem to show a watercraft. Please upload a yacht, boat, or other water vessel to continue.";

  const coerceNotBoat = (val: unknown): string | null => {
    // Legacy: not_boat is already a string message
    if (typeof val === 'string' && val.trim()) return val;
    // New format: boolean flag + message field next to it
    if (val === true) return DEFAULT_NB;
    return null;
  };

  // Case A: Array at top-level
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0] as Record<string, unknown> | undefined;
    if (first && 'not_boat' in first) {
      const msg = coerceNotBoat(first.not_boat) ?? (first.not_boat_user_message as string | undefined) ?? DEFAULT_NB;
      if (typeof msg === 'string' && (first.not_boat === true || typeof first.not_boat === 'string')) {
        return { not_boat: msg };
      }
    }
  }

  // Case B: Object with flags
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;

    if ('not_boat' in obj) {
      const msg = coerceNotBoat(obj.not_boat) ?? (obj.not_boat_user_message as string | undefined) ?? DEFAULT_NB;
      if (obj.not_boat === true || typeof obj.not_boat === 'string') {
        return { not_boat: msg };
      }
    }

    if ('body' in obj && Array.isArray(obj.body) && obj.body[0]) {
      const first = obj.body[0] as Record<string, unknown>;
      if ('not_boat' in first) {
        const msg =
          coerceNotBoat(first.not_boat) ?? (first.not_boat_user_message as string | undefined) ?? (obj.not_boat_user_message as string | undefined) ?? DEFAULT_NB;
        if (first.not_boat === true || typeof first.not_boat === 'string') {
          return { not_boat: msg };
        }
      }
    }
  }

  // Case C: array or { body: [...] } - success case
  let items: Match[] = [];

  if (Array.isArray(data)) {
    items = data;
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.body)) {
      items = obj.body;
    }
  }

  return { results: items };
}

/**
 * Send image to Supabase Edge Function for secure processing via FormData
 */
export async function searchImageWithWebhook(file: File): Promise<SearchResponse> {
  try {
    logger.info('Sending image to Supabase Edge Function...');

    // Create FormData with the image file
    const formData = new FormData();
    formData.append('photo', file);

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-n8n-webhook`;

    if (!import.meta.env.VITE_SUPABASE_URL) {
      throw new Error('Missing Supabase configuration');
    }

    // Try to attach the user's JWT so the Edge Function can identify the caller
    let authHeader = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) authHeader = `Bearer ${session.access_token}`;
    } catch (_e) {
      logger.warn('Unable to read session for Edge Function auth; falling back to anon');
    }

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        // Note: Don't set Content-Type for FormData - browser sets it automatically with boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function request failed with status: ${response.status}. ${errorText}`);
    }

    const data = await response.json();
    logger.debug('Edge Function response:', data);

    return processWebhookResponse(data);
  } catch (error) {
    logger.error('Error sending to Edge Function:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
