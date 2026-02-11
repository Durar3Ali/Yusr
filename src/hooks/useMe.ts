import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getMe } from '@/lib/api/users';

export function useMe() {
  const [authUser, setAuthUser] = useState<Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user']>(null);
  const [me, setMe] = useState<{ id: number; full_name: string | null; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isInitialized = false;
    
    let sub = supabase.auth.onAuthStateChange(async (_e, session) => {
      // Only update auth state after initial check completes
      if (isInitialized) {
        const u = session?.user ?? null;
        setAuthUser(u);
        if (u) setMe(await getMe());
        else setMe(null);
      }
    });
    
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      if (user) setMe(await getMe());
      isInitialized = true;
      setLoading(false);
    })();
    return () => sub.data.subscription.unsubscribe();
  }, []);
  return { authUser, me, loading };
}

