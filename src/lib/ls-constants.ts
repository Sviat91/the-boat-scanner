export const LS_PACK3_URL = 'https://shop.theboatscanner.com/buy/78c6c711-133d-4cd3-ae18-fc66bde0c1b6'
export const LS_PACK12_URL = 'https://shop.theboatscanner.com/buy/64232b02-cd51-4151-99c2-d439a4f4cd53'

import { supabase } from '@/lib/supabase'

export function buildLsUrl(kind: 'pack3' | 'pack12'): string {
  const baseUrl = kind === 'pack3' ? LS_PACK3_URL : LS_PACK12_URL
  const uid = supabase.auth.user()?.id
  if (!uid) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}checkout[custom][uid]=${uid}`
}
