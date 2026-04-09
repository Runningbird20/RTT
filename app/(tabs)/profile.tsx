import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import StatCard from '@/components/StatCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { signInWithPassword, signOutUser, signUpWithPassword } from '@/lib/auth';
import { getSupabaseSetupMessage, supportedSupabaseKeyEnvVars } from '@/lib/supabase';
import { useSupabaseSession } from '@/lib/useSupabaseSession';

export default function ProfileScreen() {
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(getSupabaseSetupMessage());

  const isSignedIn = Boolean(session?.user);
  const accountLabel = isLoadingSession ? 'Checking' : isSignedIn ? 'Signed in' : 'Signed out';

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setMessage(getSupabaseSetupMessage());
      return;
    }

    if (session?.user) {
      setMessage(`Signed in as ${session.user.email ?? session.user.id}.`);
      return;
    }

    if (!isLoadingSession) {
      setMessage('Sign in or create an account to sync workouts with Supabase.');
    }
  }, [isLoadingSession, isSupabaseConfigured, session]);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithPassword(email, password);
      setMessage(`Signed in as ${email.trim()}.`);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to sign in.';
      setMessage(nextMessage);
      Alert.alert('Sign in failed', nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter both email and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signUpWithPassword(email, password);
      setMessage(
        result.requiresEmailConfirmation
          ? 'Account created. Check your email to confirm the account before signing in.'
          : `Account created and signed in as ${email.trim()}.`
      );
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to create account.';
      setMessage(nextMessage);
      Alert.alert('Sign up failed', nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSubmitting(true);
      await signOutUser();
      setMessage('Signed out. Sign back in to keep syncing data.');
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'Unable to sign out.';
      setMessage(nextMessage);
      Alert.alert('Sign out failed', nextMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Manage your Supabase connection and account session from here.
        </Text>
      </View>

      <StatCard
        title="Supabase"
        value={isSupabaseConfigured ? 'Configured' : 'Missing env'}
        caption={getSupabaseSetupMessage()}
        accent={isSupabaseConfigured ? '#0f766e' : '#b45309'}
      />

      <StatCard
        title="Account"
        value={accountLabel}
        caption={
          isSignedIn
            ? session?.user.email ?? 'Authenticated session active.'
            : 'Sign in to read and write your workout data.'
        }
      />

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Auth</Text>
        <Text style={styles.item}>{message}</Text>
        <Text style={styles.item}>Supported env key names: {supportedSupabaseKeyEnvVars.join(', ')}</Text>

        {isSignedIn ? (
          <>
            <Text style={styles.item}>Current user: {session?.user.email ?? session?.user.id}</Text>
            <Button
              title={isSubmitting ? 'Signing out...' : 'Sign Out'}
              onPress={handleSignOut}
              variant="dark"
              disabled={isSubmitting}
            />
          </>
        ) : (
          <>
            <Input
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={isSupabaseConfigured}
            />
            <Input
              label="Password"
              placeholder="At least 6 characters"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              editable={isSupabaseConfigured}
            />
            <View style={styles.buttonRow}>
              <View style={styles.buttonSlot}>
                <Button
                  title={isSubmitting ? 'Working...' : 'Sign In'}
                  onPress={handleSignIn}
                  disabled={!isSupabaseConfigured || isSubmitting}
                />
              </View>
              <View style={styles.buttonSlot}>
                <Button
                  title={isSubmitting ? 'Working...' : 'Create Account'}
                  onPress={handleSignUp}
                  variant="secondary"
                  disabled={!isSupabaseConfigured || isSubmitting}
                />
              </View>
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 20,
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  card: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonSlot: {
    flex: 1,
  },
});
