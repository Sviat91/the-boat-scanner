import { supabase } from '@/lib/supabase';

export const handleGoogleCredential = async ({
  credential,
}: {
  credential: string;
}) => {
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: credential,
  });
  if (!error) window.location.reload();
};
