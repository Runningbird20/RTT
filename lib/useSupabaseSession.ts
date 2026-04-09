import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(isSupabaseConfigured);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!supabase) {
        if (isMounted) {
          setSession(null);
          setIsLoadingSession(false);
        }
        return;
      }

      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
      } else {
        setSession(data.session ?? null);
      }

      setIsLoadingSession(false);
    }

    void loadSession();

    const subscription = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setIsLoadingSession(false);
    }).data.subscription;

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    session,
    isLoadingSession,
    isSupabaseConfigured,
  };
}
