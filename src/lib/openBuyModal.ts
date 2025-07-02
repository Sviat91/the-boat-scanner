// A single place to launch the purchase flow using Lemon Squeezy overlay.
import { supabase } from '@/lib/supabase'

type LemonSqueezy = {
  open: (options: { checkout: string; custom?: Record<string, unknown> }) => void
}

declare global {
  interface Window {
    createLemonSqueezy?: () => LemonSqueezy
  }
}

let loader: Promise<LemonSqueezy> | null = null

const loadLemonSqueezy = (): Promise<LemonSqueezy> => {
  if (loader) return loader
  loader = new Promise((resolve, reject) => {
    if (typeof window.createLemonSqueezy === 'function') {
      resolve(window.createLemonSqueezy())
      return
    }
    const script = document.createElement('script')
    script.src = 'https://app.lemonsqueezy.com/js/lemon.js'
    script.async = true
    script.onload = () => {
      if (window.createLemonSqueezy) {
        resolve(window.createLemonSqueezy())
      } else {
        reject(new Error('LemonSqueezy failed to load'))
      }
    }
    script.onerror = reject
    document.head.appendChild(script)
  })
  return loader
}

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
