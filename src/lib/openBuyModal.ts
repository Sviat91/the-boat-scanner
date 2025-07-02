// A single place to launch the purchase flow using Lemon Squeezy overlay.
import { supabase } from '@/lib/supabase'

type LemonSqueezy = {
  open: (options: { checkout: string; custom?: Record<string, unknown> }) => void
}

declare global {
  interface Window {
    LemonSqueezy: LemonSqueezy
    createLemonSqueezy: () => LemonSqueezy
  }
}

const loadLemonSqueezy = () =>
  new Promise<typeof window.LemonSqueezy>((resolve) => {
    if (window.LemonSqueezy) return resolve(window.LemonSqueezy)
    const s = document.createElement('script')
    s.src = 'https://app.lemonsqueezy.com/js/lemon.js'
    s.defer = true
    s.onload = () => {
      window.LemonSqueezy = window.createLemonSqueezy()
      resolve(window.LemonSqueezy)
    }
    document.head.appendChild(s)
  })

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
