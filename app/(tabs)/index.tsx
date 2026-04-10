import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import BigActionButton from '@/components/BigActionButton';
import ChartCard from '@/components/ChartCard';
import StatCard from '@/components/StatCard';
import Card from '@/components/ui/Card';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import { fetchRecentWorkouts } from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type { ChartPoint, WorkoutRecord } from '@/lib/types';

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeScreen() {
  const isFocused = useIsFocused();
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutRecord[]>([]);
  const [isLoadingWorkouts, setIsLoadingWorkouts] = useState(false);
  const [syncMessage, setSyncMessage] = useState(getSupabaseSetupMessage());

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!isFocused || isLoadingSession) {
        return;
      }

      if (!isSupabaseConfigured) {
        if (isMounted) {
          setRecentWorkouts([]);
          setSyncMessage(getSupabaseSetupMessage());
        }
        return;
      }

      if (!session) {
        if (isMounted) {
          setRecentWorkouts([]);
          setSyncMessage('Sign in on the Profile tab to load your training dashboard from Supabase.');
        }
        return;
      }

      try {
        setIsLoadingWorkouts(true);
        const workouts = await fetchRecentWorkouts(session, 12);

        if (!isMounted) {
          return;
        }

        setRecentWorkouts(workouts);
        setSyncMessage(
          workouts.length > 0
            ? `Loaded ${workouts.length} recent workout logs from Supabase.`
            : 'Connected to Supabase. Start by saving your first workout on the Log tab.'
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unable to load your dashboard.';
        setRecentWorkouts([]);
        setSyncMessage(message);
      } finally {
        if (isMounted) {
          setIsLoadingWorkouts(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [isFocused, isLoadingSession, isSupabaseConfigured, session]);

  const workoutChartData: ChartPoint[] =
    recentWorkouts.length > 0
      ? recentWorkouts
          .slice(0, 5)
          .reverse()
          .map((workout) => ({
            label: formatShortDate(workout.performedAt),
            value: 1,
          }))
      : [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>READY TO TRAIN</Text>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>
          Your dashboard reads the latest workout logs you save to Supabase.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Recent Logs"
          value={String(recentWorkouts.length)}
          caption={session ? 'Pulled from Supabase' : 'Sign in to sync'}
        />
        <StatCard
          title="Latest Log"
          value={recentWorkouts[0] ? formatShortDate(recentWorkouts[0].performedAt) : '--'}
          caption={recentWorkouts[0]?.title ?? 'Save a workout to see it here.'}
          accent="#0f766e"
        />
      </View>

      <BigActionButton
        title="Log today's workout"
        description="Jump into the log tab to save exercise, sets, reps, weight, and notes in one form."
      />

      <Card style={styles.syncCard}>
        <Text style={styles.syncTitle}>Connection</Text>
        <Text style={styles.syncText}>{syncMessage}</Text>
        {isLoadingWorkouts ? <Text style={styles.syncHint}>Refreshing dashboard...</Text> : null}
      </Card>

      <ChartCard
        title="Recent Workout Logs"
        subtitle="One bar per saved session"
        data={workoutChartData}
        footer={
          session
            ? 'Each bar marks a workout log saved from the Log tab.'
            : 'Sign in to replace the empty chart with your live workout history.'
        }
      />

      <Card style={styles.listCard}>
        <Text style={styles.listTitle}>Recent activity</Text>
        {recentWorkouts.length === 0 ? (
          <Text style={styles.listItem}>No synced workouts yet.</Text>
        ) : (
          recentWorkouts.slice(0, 4).map((workout) => (
            <Text key={workout.id} style={styles.listItem}>
              {formatShortDate(workout.performedAt)} - {workout.title}
            </Text>
          ))
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
  hero: {
    gap: 10,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#fffdf8',
    borderWidth: 1,
    borderColor: '#eadfce',
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#0f766e',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  syncCard: {
    gap: 8,
  },
  syncTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  syncText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  syncHint: {
    fontSize: 13,
    color: '#6b7280',
  },
  listCard: {
    gap: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
});
