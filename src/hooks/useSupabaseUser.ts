'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface SupabaseUserState {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
}

export function useSupabaseUser(): SupabaseUserState {
  const [state, setState] = useState<SupabaseUserState>({ user: null, session: null, isLoaded: false });

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    setState({ user: session?.user ?? null, session, isLoaded: true });
  }, []);

  useEffect(() => {
    refresh();
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, isLoaded: true });
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  return state;
}

export function useSupabaseSignOut() {
  return useCallback(async (redirectUrl = '/') => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = redirectUrl;
  }, []);
}
