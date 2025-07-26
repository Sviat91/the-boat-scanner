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
 * Convert file to base64 string for JSON transmission
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

/**
 * Send image to Supabase Edge Function for secure processing
 */
export async function searchImageWithWebhook(file: File): Promise<SearchResponse> {
  try {
    console.log('Sending image to Supabase Edge Function...');

    // Convert file to base64 for JSON transmission
    const base64Image = await fileToBase64(file);
    
    // Prepare request data for Edge Function
    const requestData = {
      photo: base64Image,
      filename: file.name,
      mimetype: file.type,
      size: file.size
    };

    const edgeFunctionUrl = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/proxy-n8n-webhook';
    
    if (!import.meta.env.VITE_SUPABASE_URL) {
      throw new Error('Missing Supabase configuration');
    }
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function request failed with status: ${response.status}. ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Edge Function response:', data);
    
    return processWebhookResponse(data);
    
  } catch (error) {
    console.error('Error sending to Edge Function:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}