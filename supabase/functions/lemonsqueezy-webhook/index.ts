import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const addDays = (date: Date, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

serve(async (req) => {
  const event = req.headers.get('x-event-name') || ''
  const payload = await req.json().catch(() => null)
  console.log('LS WEBHOOK —', event, JSON.stringify(payload))

  if (!payload) {
    return new Response(JSON.stringify({ ok: false }), { status: 400 })
  }

  const uid =
    payload?.meta?.custom_data?.uid ??
    payload?.data?.attributes?.checkout_data?.custom?.uid ??
    payload?.data?.attributes?.custom_data?.uid

  if (!uid) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  }

  const variant =
    payload?.data?.attributes?.first_order_item?.variant_name ??
    payload?.data?.attributes?.variant_name ??
    payload?.data?.attributes?.order_items?.[0]?.variant_name

  if (variant === 'Unlimited-month') {
    const until = addDays(new Date(), 30)
    const { error } = await supabase
      .from('user_credits')
      .update({ subscribed_until: until })
      .eq('user_id', uid)
    if (error) console.error('Failed updating sub', error)
  } else if (variant?.includes('3')) {
    const { error } = await supabase.rpc('add_paid_credits', { uid, amount: 3 })
    if (error) console.error('Failed adding credits', error)
  } else if (variant?.includes('12')) {
    const { error } = await supabase.rpc('add_paid_credits', { uid, amount: 12 })
    if (error) console.error('Failed adding credits', error)
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

