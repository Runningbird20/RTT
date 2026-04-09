import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import Card from '@/components/ui/Card';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import { fetchRecentWorkouts } from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type { WorkoutRecord } from '@/lib/types';

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const isFocused = useIsFocused();
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [message, setMessage] = useState(getSupabaseSetupMessage());

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      if (!isFocused || isLoadingSession) {
        return;
      }

      if (!isSupabaseConfigured) {
        if (isMounted) {
          setWorkouts([]);
          setMessage(getSupabaseSetupMessage());
        }
        return;
      }

      if (!session) {
        if (isMounted) {
          setWorkouts([]);
          setMessage('Sign in on the Profile tab to load your workout history.');
        }
        return;
      }

      try {
        setIsLoadingWorkouts(true);
        const recentWorkouts = await fetchRecentWorkouts(session, 20);

        if (!isMounted) {
          return;
        }

        setWorkouts(recentWorkouts);
        setMessage(
          recentWorkouts.length > 0
            ? 'Showing recent workouts from Supabase.'
            : 'Connected to Supabase. Your workout history will appear here after your first saved session.'
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error instanceof Error ? error.message : 'Unable to load workout history.';
        setWorkouts([]);
        setMessage(nextMessage);
      } finally {
        if (isMounted) {
          setIsLoadingWorkouts(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [isFocused, isLoadingSession, isSupabaseConfigured, session]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Recent workouts synced from Supabase appear here.</Text>
      </View>

      <Card style={styles.messageCard}>
        <Text style={styles.messageTitle}>Workout feed</Text>
        <Text style={styles.messageText}>{message}</Text>
        {isLoadingWorkouts ? <Text style={styles.messageHint}>Refreshing history...</Text> : null}
      </Card>

      {workouts.map((entry) => (
        <Card key={entry.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{entry.title}</Text>
            <Text style={styles.badge}>{entry.intensity}</Text>
          </View>
          <Text style={styles.meta}>
            {formatLongDate(entry.performedAt)} - {entry.durationMinutes ?? 0} min
          </Text>
          <Text style={styles.notes}>{entry.notes || 'No notes added.'}</Text>
        </Card>
      ))}

      {!isLoadingWorkouts && workouts.length === 0 ? (
        <Card style={styles.card}>
          <Text style={styles.notes}>No workout history yet.</Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
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
  messageCard: {
    gap: 8,
  },
  messageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  messageHint: {
    fontSize: 13,
    color: '#6b7280',
  },
  card: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e',
    backgroundColor: '#d8f3ed',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  meta: {
    fontSize: 14,
    color: '#6b7280',
  },
  notes: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
});
