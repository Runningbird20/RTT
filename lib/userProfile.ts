import type { Session, User } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/lib/supabase';
import type { UserProfile } from '@/lib/types';

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

function requireAuthUser(session: Session | null): User {
  const user = session?.user;

  if (!user) {
    throw new Error('Sign in on the Profile tab to sync with Supabase.');
  }

  return user;
}

function mapUserRow(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function ensureAppUserProfile(session: Session | null): Promise<UserProfile> {
  const client = getSupabaseClient();
  const authUser = requireAuthUser(session);
  const authEmail = readOptionalString(authUser.email)?.toLowerCase() ?? null;

  const { data: directMatch, error: directMatchError } = await client
    .from('users')
    .select('id, email, display_name, avatar_url, created_at, updated_at')
    .eq('id', authUser.id)
    .maybeSingle<UserRow>();

  if (directMatchError) {
    throw directMatchError;
  }

  if (directMatch) {
    return mapUserRow(directMatch);
  }

  if (authEmail) {
    const { data: emailMatch, error: emailMatchError } = await client
      .from('users')
      .select('id, email, display_name, avatar_url, created_at, updated_at')
      .ilike('email', authEmail)
      .maybeSingle<UserRow>();

    if (emailMatchError) {
      throw emailMatchError;
    }

    if (emailMatch) {
      return mapUserRow(emailMatch);
    }
  }

  if (!authEmail) {
    throw new Error('The signed-in account is missing an email address, so the app cannot match a training profile.');
  }

  const displayName =
    readOptionalString(authUser.user_metadata?.display_name) ??
    readOptionalString(authUser.user_metadata?.full_name);
  const avatarUrl = readOptionalString(authUser.user_metadata?.avatar_url);

  const { data: createdProfile, error: createdProfileError } = await client
    .from('users')
    .insert({
      id: authUser.id,
      email: authEmail,
      display_name: displayName,
      avatar_url: avatarUrl,
    })
    .select('id, email, display_name, avatar_url, created_at, updated_at')
    .single<UserRow>();

  if (createdProfileError) {
    if (createdProfileError.code === '23505') {
      throw new Error(
        'This email already exists in public.users under a different UUID. The imported data needs to be remapped to auth.users before the app can load it.'
      );
    }

    throw createdProfileError;
  }

  return mapUserRow(createdProfile);
}

export async function resolveAppUserId(session: Session | null): Promise<string> {
  const profile = await ensureAppUserProfile(session);
  return profile.id;
}
