import { AppState, Platform } from 'react-native';

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';

export const requiredSupabaseEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'one of EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or EXPO_PUBLIC_SUPABASE_KEY',
] as const;

export const supportedSupabaseKeyEnvVars = [
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_KEY',
] as const;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const configuredSupabaseKeyEnvVar = supportedSupabaseKeyEnvVars.find(
  (envVarName) => Boolean(process.env[envVarName])
);
const supabaseKey = configuredSupabaseKeyEnvVar ? process.env[configuredSupabaseKeyEnvVar] ?? '' : '';

export const supabaseConfig = {
  url: supabaseUrl,
  key: supabaseKey,
};

export const activeSupabaseKeyEnvVar = configuredSupabaseKeyEnvVar ?? null;

export const isSupabaseConfigured = Boolean(supabaseConfig.url && supabaseConfig.key);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseConfig.url, supabaseConfig.key, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
    })
  : null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    throw new Error(getSupabaseSetupMessage());
  }

  return supabase;
}

if (Platform.OS !== 'web' && supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

export function getSupabaseSetupMessage(): string {
  if (isSupabaseConfigured) {
    return `Supabase environment variables detected and client initialized using ${activeSupabaseKeyEnvVar ?? 'an unknown key variable'}.`;
  }

  return `Add ${requiredSupabaseEnvVars.join(' and ')} to your Expo environment to connect Supabase.`;
}
