import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

// Безопасно получаем переменные окружения, установленные в Supabase
const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL')
const n8nSecretToken = Deno.env.get('N8N_SECRET_TOKEN')

serve(async (req) => {
  // 1. Проверяем, что все необходимые переменные окружения заданы
  if (!n8nWebhookUrl || !n8nSecretToken) {
    console.error('Missing N8N_WEBHOOK_URL or N8N_SECRET_TOKEN')
    return new Response(
      JSON.stringify({ error: 'Internal server configuration error.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // 2. Разрешаем CORS-запросы от вашего сайта и обрабатываем preflight-запрос
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*', // Можно заменить на ваш домен для большей безопасности
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    }})
  }

  try {
    // 3. Получаем данные, которые прислал клиент (например, поисковый запрос)
    const clientData = await req.json()

    // 4. Отправляем запрос в n8n, добавляя секретный токен
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${n8nSecretToken}`, // Используем токен здесь
      },
      body: JSON.stringify(clientData),
    })

    // 5. Проверяем, что n8n ответил успешно
    if (!n8nResponse.ok) {
      const errorBody = await n8nResponse.text()
      console.error(`n8n webhook returned an error: ${n8nResponse.status}`, errorBody)
      return new Response(
        JSON.stringify({ error: 'Failed to process request via n8n.' }),
        { status: n8nResponse.status, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // 6. Возвращаем ответ от n8n клиенту
    const data = await n8nResponse.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Можно заменить на ваш домен
      },
    })

  } catch (error) {
    console.error('Error proxying request to n8n:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})