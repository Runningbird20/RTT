import type { Session } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabase';

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session ?? null;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ requiresEmailConfirmation: boolean }> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return {
    requiresEmailConfirmation: !data.session,
  };
}

export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) {
    throw error;
  }
}
