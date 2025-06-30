import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

serve(async (req) => {
  const body = await req.text();
  console.log(
    'LS WEBHOOK —',
    req.headers.get('x-event-name') ?? 'no-event',
    body,
  );

  // TODO: add HMAC validation + credit updates when store goes live
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
