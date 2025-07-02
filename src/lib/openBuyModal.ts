// src/lib/openBuyModal.ts
import { toast } from 'sonner'            // если toasts уже используются
import supabase from '@/lib/supabase'

type LemonSqueezy = { open(o: unknown): void }

declare global {
  interface Window {
    createLemonSqueezy?: () => LemonSqueezy
    LemonSqueezy?: LemonSqueezy
  }
}

/** загрузка скрипта, всегда возвращает экземпляр или ошибку */
const loadLemonSqueezy = () =>
  new Promise<LemonSqueezy>((resolve, reject) => {
    // 1. если уже есть — отдаём
    if (window.LemonSqueezy) return resolve(window.LemonSqueezy)

    // 2. если скрипт уже создан — ждём window.createLemonSqueezy
    if (typeof window.createLemonSqueezy === 'function') {
      return resolve((window.LemonSqueezy = window.createLemonSqueezy()))
    }

    // 3. вешаем скрипт
    const s = document.createElement('script')
    s.src   = 'https://app.lemonsqueezy.com/js/lemon.js'
    s.defer = true
    s.onload = () => {
      if (typeof window.createLemonSqueezy === 'function') {
        window.LemonSqueezy = window.createLemonSqueezy()
        resolve(window.LemonSqueezy)
      } else {
        reject(new Error('LemonSqueezy loaded, but factory not found'))
      }
    }
    s.onerror = reject
    document.head.appendChild(s)
  })

// ID-шники ваших паков
const VARIANTS = {
  PACK3 : '882183',   // 3 credits
  PACK12: '881213',   // 12 credits
  PACKM : '882203',   // subscription / unlimited
} as const

export const openBuyModal = async (pack: keyof typeof VARIANTS) => {
  try {
    const LS = await loadLemonSqueezy()
    LS.open({
      checkout: VARIANTS[pack],
      custom  : { user_id: supabase.auth.user()?.id },
    })
  } catch (err) {
    console.error('Could not open checkout', err)
    toast.error('Checkout failed to load, please try again later.')
  }
}
