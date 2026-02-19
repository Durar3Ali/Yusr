import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMe } from '@/lib/api/users';

export function useMe() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [me, setMe] = useState<{ id: number; full_name: string | null; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (authUser) {
      setLoading(true);
      getMe()
        .then(data => { setMe(data); setLoading(false); })
        .catch(() => { setMe(null); setLoading(false); });
    } else {
      setMe(null);
      setLoading(false);
    }
  }, [authUser, authLoading]);

  return { authUser, me, loading };
}
