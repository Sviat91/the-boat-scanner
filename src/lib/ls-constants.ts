import { supabase } from '@/lib/supabase';

export const LS_PACK3_URL =
  'https://shop.theboatscanner.com/buy/8fbe2711-602c-4b20-83ee-80afce7b5e49';
export const LS_PACK12_URL =
  'https://shop.theboatscanner.com/buy/b4788b8f-537d-49de-ab10-bea483161546';
export const LS_UNLIMITED_URL =
  'https://shop.theboatscanner.com/buy/dd6c1601-60e0-4f8d-857f-7aca6138d8fc';

export const buildLsUrl = async (kind: 'pack3' | 'pack12' | 'unlimited'): Promise<string> => {
  const baseUrl =
    kind === 'pack3' ? LS_PACK3_URL : kind === 'pack12' ? LS_PACK12_URL : LS_UNLIMITED_URL;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const uid = session?.user.id;
  if (!uid) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}checkout[custom][uid]=${uid}`;
};
