import { supabase } from '@/lib/supabase';

export interface Favorite {
  id: number;
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  created_at: string;
}

export async function listFavorites() {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Favorite[];
}

export async function addFavorite(url: string, extra?: Partial<Favorite>) {
  const { data, error } = await supabase
    .from('favorites')
    .insert({ url, ...extra })
    .select();
  if (error) throw error;
  return data?.[0] as Favorite | undefined;
}

export async function removeFavorite(url: string) {
  const { error } = await supabase.from('favorites').delete().eq('url', url);
  if (error) throw error;
}

export async function isFavorite(url: string) {
  const { data, error } = await supabase.from('favorites').select('id').eq('url', url).limit(1);
  if (error) throw error;
  return !!data?.length;
}
