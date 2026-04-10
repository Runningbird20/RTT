import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import BodyweightForm from '@/components/BodyweightForm';
import PerformanceForm from '@/components/PerformanceForm';
import WorkoutLogForm from '@/components/WorkoutLogForm';
import Card from '@/components/ui/Card';
import { formatError } from '@/lib/formatError';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import {
  createBodyweightEntry,
  createPerformanceMetricEntry,
  createWorkoutLog,
  fetchRecentBodyweightEntries,
} from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type {
  BodyweightEntryRecord,
  BodyweightFormValues,
  PerformanceMetricFormValues,
  WorkoutLogFormValues,
} from '@/lib/types';

function formatEntryDate(value: string): string {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function LogScreen() {
  const isFocused = useIsFocused();
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [syncMessage, setSyncMessage] = useState(getSupabaseSetupMessage());
  const [recentBodyweightEntries, setRecentBodyweightEntries] = useState<BodyweightEntryRecord[]>([]);
  const [isLoadingBodyweightEntries, setIsLoadingBodyweightEntries] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    async function loadRecentBodyweightEntries() {
      if (!isFocused || isLoadingSession) {
        return;
      }

      if (!isSupabaseConfigured || !session) {
        if (isMounted) {
          setRecentBodyweightEntries([]);
        }
        return;
      }

      try {
        setIsLoadingBodyweightEntries(true);
        const entries = await fetchRecentBodyweightEntries(session, 5);

        if (!isMounted) {
          return;
        }

        setRecentBodyweightEntries([...entries].reverse());
      } catch {
        if (isMounted) {
          setRecentBodyweightEntries([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBodyweightEntries(false);
        }
      }
    }

    void loadRecentBodyweightEntries();

    return () => {
      isMounted = false;
    };
  }, [isFocused, isLoadingSession, isSupabaseConfigured, session]);

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
      const savedEntry = await createBodyweightEntry(session, values, null);
      setRecentBodyweightEntries((current) => [savedEntry, ...current].slice(0, 5));
      setSyncMessage('Bodyweight synced to Supabase.');
    } catch (error) {
      const message = formatError(error, 'Unable to save bodyweight entry.');
      setSyncMessage(message);
      throw error;
    }
  };

  const handlePerformanceSubmit = async (values: PerformanceMetricFormValues) => {
    try {
      const savedEntry = await createPerformanceMetricEntry(session, values);
      setSyncMessage(
        `${savedEntry.metricName} synced to Supabase${savedEntry.unit ? ` in ${savedEntry.unit}` : ''}.`
      );
    } catch (error) {
      const message = formatError(error, 'Unable to save performance entry.');
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
            ? 'This saves a date + weight entry to bodyweight_entries in Supabase.'
            : 'Sign in on the Profile tab before saving bodyweight entries.'
        }
      />

      <PerformanceForm
        onSubmit={handlePerformanceSubmit}
        disabled={!session}
        helperText={
          session
            ? 'This saves a metric type, numeric value, and unit to performance_entries in Supabase.'
            : 'Sign in on the Profile tab before saving performance entries.'
        }
      />

      <Card style={styles.statusCard}>
        <Text style={styles.statusTitle}>Recent bodyweight entries</Text>
        {isLoadingBodyweightEntries ? (
          <Text style={styles.statusHint}>Refreshing recent entries...</Text>
        ) : recentBodyweightEntries.length > 0 ? (
          recentBodyweightEntries.map((entry) => (
            <View key={entry.id} style={styles.entryRow}>
              <Text style={styles.entryDate}>{formatEntryDate(entry.entryDate)}</Text>
              <Text style={styles.entryWeight}>{entry.weight.toFixed(1)} lb</Text>
            </View>
          ))
        ) : (
          <Text style={styles.statusHint}>No bodyweight entries yet.</Text>
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
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  entryDate: {
    fontSize: 15,
    color: '#374151',
  },
  entryWeight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});
