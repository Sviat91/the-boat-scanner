import { supabase } from '@/lib/supabase'

export const LS_PACK3_URL = 'https://shop.theboatscanner.com/buy/78c6c711-133d-4cd3-ae18-fc66bde0c1b6'
export const LS_PACK12_URL = 'https://shop.theboatscanner.com/buy/64232b02-cd51-4151-99c2-d439a4f4cd53'
export const LS_UNLIMITED_URL = 'https://shop.theboatscanner.com/buy/618d34de-5dbc-4f77-93ce-92b503b4b3d8'

export const buildLsUrl = async (kind: 'pack3' | 'pack12' | 'unlimited'): Promise<string> => {
  const baseUrl =
    kind === 'pack3'
      ? LS_PACK3_URL
      : kind === 'pack12'
        ? LS_PACK12_URL
        : LS_UNLIMITED_URL
  const { data: { session } } = await supabase.auth.getSession()
  const uid = session?.user.id
  if (!uid) return baseUrl
  const separator = baseUrl.includes('?') ? '&' : '?'
  return `${baseUrl}${separator}checkout[custom][uid]=${uid}`
}

