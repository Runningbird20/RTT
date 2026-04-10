import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import BodyweightForm from '@/components/BodyweightForm';
import WorkoutLogForm from '@/components/WorkoutLogForm';
import Card from '@/components/ui/Card';
import { formatError } from '@/lib/formatError';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import { createBodyweightEntry, createWorkoutLog } from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type { BodyweightFormValues, WorkoutLogFormValues } from '@/lib/types';

export default function LogScreen() {
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [syncMessage, setSyncMessage] = useState(getSupabaseSetupMessage());

  useEffect(() => {
    if (isLoadingSession) {
      return;
    }

    if (!isSupabaseConfigured) {
      setSyncMessage(getSupabaseSetupMessage());
      return;
    }

    if (!session) {
      setSyncMessage('Sign in on the Profile tab to save workout logs to Supabase.');
      return;
    }

    setSyncMessage('Signed in and ready to save workout logs to Supabase.');
  }, [isLoadingSession, isSupabaseConfigured, session]);

  const handleWorkoutSubmit = async (values: WorkoutLogFormValues) => {
    try {
      const result = await createWorkoutLog(session, values);
      setSyncMessage(`${result.workout.title} saved to Supabase with linked exercise metrics.`);
    } catch (error) {
      const message = formatError(error, 'Unable to save workout log.');
      setSyncMessage(message);
      throw error;
    }
  };

  const handleBodyweightSubmit = async (values: BodyweightFormValues) => {
    try {
      await createBodyweightEntry(session, values, null);
      setSyncMessage('Bodyweight synced to Supabase.');
    } catch (error) {
      const message = formatError(error, 'Unable to save bodyweight entry.');
      setSyncMessage(message);
      throw error;
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Workout Log</Text>
        <Text style={styles.subtitle}>
          Capture exercise, sets, reps, weight, and notes in a single save to Supabase.
        </Text>
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.statusTitle}>Sync status</Text>
        <Text style={styles.statusText}>{syncMessage}</Text>
        {isLoadingSession ? <Text style={styles.statusHint}>Checking session...</Text> : null}
      </Card>

      <WorkoutLogForm
        onSubmit={handleWorkoutSubmit}
        disabled={!session}
        helperText={
          session
            ? 'This creates linked workouts, exercise_entries, and performance_entries rows in Supabase.'
            : 'Sign in on the Profile tab before saving workout logs.'
        }
      />

      <BodyweightForm
        onSubmit={handleBodyweightSubmit}
        disabled={!session}
        helperText={
          session
            ? 'This still saves to bodyweight_entries in Supabase.'
            : 'Sign in on the Profile tab before saving bodyweight entries.'
        }
      />
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
  statusCard: {
    gap: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  statusHint: {
    fontSize: 13,
    color: '#6b7280',
  },
});
