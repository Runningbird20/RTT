import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import BodyweightForm from '@/components/BodyweightForm';
import PerformanceForm from '@/components/PerformanceForm';
import WorkoutForm from '@/components/WorkoutForm';
import Card from '@/components/ui/Card';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import {
  createBodyweightEntry,
  createExerciseAndPerformanceEntry,
  createWorkout,
  fetchLatestWorkout,
} from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type { BodyweightFormValues, PerformanceFormValues, WorkoutFormValues, WorkoutRecord } from '@/lib/types';

export default function LogScreen() {
  const isFocused = useIsFocused();
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutRecord | null>(null);
  const [syncMessage, setSyncMessage] = useState(getSupabaseSetupMessage());
  const [isLoadingWorkout, setIsLoadingWorkout] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadLatestWorkout() {
      if (!isFocused || isLoadingSession) {
        return;
      }

      if (!isSupabaseConfigured) {
        if (isMounted) {
          setActiveWorkout(null);
          setSyncMessage(getSupabaseSetupMessage());
        }
        return;
      }

      if (!session) {
        if (isMounted) {
          setActiveWorkout(null);
          setSyncMessage('Sign in on the Profile tab to save workouts to Supabase.');
        }
        return;
      }

      try {
        setIsLoadingWorkout(true);
        const latestWorkout = await fetchLatestWorkout(session);

        if (!isMounted) {
          return;
        }

        setActiveWorkout(latestWorkout);
        setSyncMessage(
          latestWorkout
            ? `Current linked workout: ${latestWorkout.title}. Performance entries will attach to it.`
            : 'Save a workout first, then performance entries will link to it automatically.'
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load workout sync status.';
        setActiveWorkout(null);
        setSyncMessage(message);
      } finally {
        if (isMounted) {
          setIsLoadingWorkout(false);
        }
      }
    }

    void loadLatestWorkout();

    return () => {
      isMounted = false;
    };
  }, [isFocused, isLoadingSession, isSupabaseConfigured, session]);

  const handleWorkoutSubmit = async (values: WorkoutFormValues) => {
    const workout = await createWorkout(session, values);
    setActiveWorkout(workout);
    setSyncMessage(`Workout synced. ${workout.title} is now the active workout for linked entries.`);
  };

  const handleBodyweightSubmit = async (values: BodyweightFormValues) => {
    await createBodyweightEntry(session, values, activeWorkout?.id ?? null);
    setSyncMessage(
      activeWorkout
        ? `Bodyweight synced and associated with ${activeWorkout.title}.`
        : 'Bodyweight synced to Supabase.'
    );
  };

  const handlePerformanceSubmit = async (values: PerformanceFormValues) => {
    if (!activeWorkout) {
      throw new Error('Save a workout first so exercise data has a workout to attach to.');
    }

    await createExerciseAndPerformanceEntry(session, activeWorkout.id, values);
    setSyncMessage(`${values.exercise || 'Exercise'} synced and linked to ${activeWorkout.title}.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Log a new entry</Text>
        <Text style={styles.subtitle}>
          Save workouts, bodyweight, and exercise performance directly to Supabase.
        </Text>
      </View>

      <Card style={styles.statusCard}>
        <Text style={styles.statusTitle}>Sync status</Text>
        <Text style={styles.statusText}>{syncMessage}</Text>
        {isLoadingWorkout ? <Text style={styles.statusHint}>Refreshing latest workout...</Text> : null}
      </Card>

      <WorkoutForm
        onSubmit={handleWorkoutSubmit}
        disabled={!session}
        helperText={
          session
            ? 'This creates a workout row in Supabase.'
            : 'Sign in on the Profile tab before saving workouts.'
        }
      />

      <BodyweightForm
        onSubmit={handleBodyweightSubmit}
        disabled={!session}
        helperText={
          session
            ? 'This saves to bodyweight_entries and optionally links to the current workout.'
            : 'Sign in on the Profile tab before saving bodyweight entries.'
        }
      />

      <PerformanceForm
        onSubmit={handlePerformanceSubmit}
        disabled={!session || !activeWorkout}
        helperText={
          session
            ? activeWorkout
              ? `This creates linked exercise_entries and performance_entries rows for ${activeWorkout.title}.`
              : 'Save a workout first so performance data can attach to it.'
            : 'Sign in on the Profile tab before saving performance entries.'
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
