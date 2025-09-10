import { supabase } from '@/lib/supabase';

export interface Favorite {
  id: number;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  created_at: string;
}

async function getUid() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function listFavorites() {
  const uid = await getUid();
  if (!uid) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', uid)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Favorite[];
}

export async function addFavorite(url: string, extra?: Partial<Favorite>) {
  const uid = await getUid();
  if (!uid) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('favorites')
    .insert({ url, user_id: uid, ...extra })
    .select();
  if (error) throw error;
  return data?.[0] as Favorite | undefined;
}

export async function removeFavorite(url: string) {
  const uid = await getUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('favorites').delete().eq('user_id', uid).eq('url', url);
  if (error) throw error;
}

export async function isFavorite(url: string) {
  const uid = await getUid();
  if (!uid) return false;
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', uid)
    .eq('url', url)
    .limit(1);
  if (error) throw error;
  return !!data?.length;
}

export async function clearFavorites() {
  const uid = await getUid();
  if (!uid) throw new Error('Not authenticated');
  const { error } = await supabase.from('favorites').delete().eq('user_id', uid);
  if (error) throw error;
}
