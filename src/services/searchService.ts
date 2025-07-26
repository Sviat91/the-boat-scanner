import { Match } from '@/components/HistoryCard';

export interface SearchResponse {
  results?: Match[];
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
  // Case A: Handle array format with not_boat message
  if (Array.isArray(data) && data.length > 0 && data[0]?.not_boat) {
    return { not_boat: data[0].not_boat };
  }
  
  // Case B: Handle other not_boat formats
  if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    
    if ('not_boat' in obj) {
      return { not_boat: obj.not_boat as string };
    }
    
    if ('body' in obj && Array.isArray(obj.body) && obj.body?.[0]?.not_boat) {
      return { not_boat: obj.body[0].not_boat };
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
 * Send image to N8N webhook for processing
 */
export async function searchImageWithWebhook(file: File): Promise<SearchResponse> {
  try {
    const formData = new FormData();
    formData.append('photo', file);
    
    console.log('Sending image to n8n webhook...');

    const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL as string;
    const secretToken = import.meta.env.VITE_N8N_SECRET_TOKEN as string;
    
    if (!webhookUrl || !secretToken) {
      throw new Error('Missing N8N webhook configuration');
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'x-secret-token': secretToken
      }
    });
    
    if (!response.ok) {
      throw new Error(`Webhook request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Webhook response:', data);
    
    return processWebhookResponse(data);
    
  } catch (error) {
    console.error('Error sending to webhook:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}