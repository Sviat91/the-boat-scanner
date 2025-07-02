// A single place to launch the purchase flow using Lemon Squeezy overlay.
import { loadLemonSqueezy } from '@lemonsqueezy/checkout'
import { supabase } from '@/lib/supabase'

const VARIANTS = {
  PACK3: '882183',
  PACK12: '882203'
} as const

export const openBuyModal = async (
  pack: keyof typeof VARIANTS = 'PACK3'
) => {
  const ls = await loadLemonSqueezy()
  ls.open({
    checkout: VARIANTS[pack],
    custom: { user_id: supabase.auth.user()?.id }
  })
}
