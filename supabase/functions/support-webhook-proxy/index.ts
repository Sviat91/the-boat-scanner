import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// Безопасно получаем переменные окружения для поддержки
const supportWebhookUrl = Deno.env.get('SUPPORT_WEBHOOK_URL');
const supportSecretToken = Deno.env.get('SUPPORT_SECRET_TOKEN');

serve(async (req) => {
  // 1. Проверяем переменные окружения
  if (!supportWebhookUrl || !supportSecretToken) {
    console.error('Missing SUPPORT_WEBHOOK_URL or SUPPORT_SECRET_TOKEN');
    return new Response(JSON.stringify({
      error: 'Internal server configuration error.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // 2. CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    console.log('Received support request to Edge Function');
    
    // 3. Получаем данные поддержки от клиента
    const supportData = await req.json();
    console.log('Support data received for user:', supportData.uid);

    // 4. Валидация данных
    if (!supportData.email || !supportData.uid || !supportData.message) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: email, uid, message'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Forwarding support request to N8N...');
    
    // 5. Отправляем запрос в N8N support webhook
    const n8nResponse = await fetch(supportWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-token': supportSecretToken
      },
      body: JSON.stringify(supportData)
    });

    console.log('N8N support response status:', n8nResponse.status);

    // 6. Проверяем ответ от N8N
    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text();
      console.error(`N8N support webhook error: ${n8nResponse.status}`, errorBody);
      return new Response(JSON.stringify({
        error: 'Failed to process support request.'
      }), {
        status: n8nResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 7. Возвращаем успешный ответ
    console.log('Support request processed successfully');
    return new Response(JSON.stringify({
      success: true,
      message: 'Support request sent successfully'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Error in support Edge Function:', error);
    return new Response(JSON.stringify({
      error: 'An unexpected error occurred while processing support request.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});