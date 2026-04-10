import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import ChartCard from '@/components/ChartCard';
import Card from '@/components/ui/Card';
import { formatSignedPercentage, getAverage, getPercentageChange } from '@/lib/calculations';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import {
  fetchRecentBodyweightEntries,
  fetchRecentPerformanceEntries,
  fetchRecentWorkouts,
} from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type {
  BodyweightEntryRecord,
  ChartPoint,
  PerformanceEntryRecord,
  WorkoutRecord,
} from '@/lib/types';

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatMetricValue(entry: PerformanceEntryRecord | undefined): string {
  if (!entry) {
    return '--';
  }

  const numericValue = entry.weight ?? entry.value;
  const suffix = entry.unit ? ` ${entry.unit}` : '';

  return `${numericValue.toFixed(1)}${suffix}`;
}

function DashboardMetricCard({
  title,
  value,
  caption,
  accent,
}: {
  title: string;
  value: string;
  caption: string;
  accent: string;
}) {
  return (
    <Card style={styles.metricCard}>
      <View style={[styles.metricAccent, { backgroundColor: accent }]} />
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </Card>
  );
}

export default function DashboardScreen() {
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [workouts, setWorkouts] = useState<WorkoutRecord[]>([]);
  const [bodyweightEntries, setBodyweightEntries] = useState<BodyweightEntryRecord[]>([]);
  const [performanceEntries, setPerformanceEntries] = useState<PerformanceEntryRecord[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [message, setMessage] = useState(getSupabaseSetupMessage());

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      if (!isFocused || isLoadingSession) {
        return;
      }

      if (!isSupabaseConfigured) {
        if (isMounted) {
          setWorkouts([]);
          setBodyweightEntries([]);
          setPerformanceEntries([]);
          setMessage(getSupabaseSetupMessage());
        }
        return;
      }

      if (!session) {
        if (isMounted) {
          setWorkouts([]);
          setBodyweightEntries([]);
          setPerformanceEntries([]);
          setMessage('Sign in on the Profile tab to load your dashboard from Supabase.');
        }
        return;
      }

      try {
        setIsLoadingDashboard(true);
        const [nextWorkouts, nextBodyweightEntries, nextPerformanceEntries] = await Promise.all([
          fetchRecentWorkouts(session, 6),
          fetchRecentBodyweightEntries(session, 8),
          fetchRecentPerformanceEntries(session, 8),
        ]);

        if (!isMounted) {
          return;
        }

        setWorkouts(nextWorkouts);
        setBodyweightEntries(nextBodyweightEntries);
        setPerformanceEntries(nextPerformanceEntries);
        setMessage('Live dashboard data loaded from Supabase.');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error instanceof Error ? error.message : 'Unable to load dashboard data.';
        setWorkouts([]);
        setBodyweightEntries([]);
        setPerformanceEntries([]);
        setMessage(nextMessage);
      } finally {
        if (isMounted) {
          setIsLoadingDashboard(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [isFocused, isLoadingSession, isSupabaseConfigured, session]);

  const columnWidth = width >= 920 ? '31.6%' : width >= 560 ? '48.2%' : '100%';
  const latestWorkout = workouts[0];
  const latestBodyweight = bodyweightEntries.at(-1);
  const previousBodyweight = bodyweightEntries.at(-2);
  const latestPerformance = performanceEntries.at(-1);

  const bodyweightDelta = latestBodyweight && previousBodyweight
    ? getPercentageChange(previousBodyweight.weight, latestBodyweight.weight)
    : 0;
  const performanceDelta =
    performanceEntries.length > 1
      ? getPercentageChange(
          performanceEntries[0]?.weight ?? performanceEntries[0]?.value ?? 0,
          performanceEntries.at(-1)?.weight ?? performanceEntries.at(-1)?.value ?? 0
        )
      : 0;

  const bodyweightChartData: ChartPoint[] = bodyweightEntries.map((entry) => ({
    label: formatShortDate(`${entry.entryDate}T12:00:00`),
    value: entry.weight,
  }));

  const performanceChartData: ChartPoint[] = performanceEntries.map((entry) => ({
    label: formatShortDate(entry.recordedAt),
    value: entry.weight ?? entry.value,
  }));

  const activityItems = useMemo(() => {
    const workoutItems = workouts.map((workout) => ({
      id: `workout-${workout.id}`,
      timestamp: workout.performedAt,
      title: workout.title,
      detail: 'Workout log',
    }));

    const performanceItems = performanceEntries.map((entry) => ({
      id: `performance-${entry.id}`,
      timestamp: entry.recordedAt,
      title: entry.metricName,
      detail: formatMetricValue(entry),
    }));

    return [...workoutItems, ...performanceItems]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);
  }, [performanceEntries, workouts]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TRAINING OVERVIEW</Text>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          A live snapshot of your workouts, bodyweight, and performance metrics.
        </Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Today at a glance</Text>
            <Text style={styles.heroText}>{message}</Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeLabel}>Status</Text>
            <Text style={styles.heroBadgeValue}>{session ? 'Synced' : 'Offline'}</Text>
          </View>
        </View>
        {isLoadingDashboard ? <Text style={styles.heroHint}>Refreshing dashboard...</Text> : null}
      </Card>

      <View style={styles.grid}>
        <View style={[styles.gridItem, { width: columnWidth }]}>
          <DashboardMetricCard
            title="Recent Workouts"
            value={String(workouts.length)}
            caption={
              latestWorkout
                ? `Latest: ${formatShortDate(latestWorkout.performedAt)}`
                : 'Save a workout to populate the dashboard.'
            }
            accent="#1d4ed8"
          />
        </View>

        <View style={[styles.gridItem, { width: columnWidth }]}>
          <DashboardMetricCard
            title="Latest Bodyweight"
            value={latestBodyweight ? `${latestBodyweight.weight.toFixed(1)} lb` : '--'}
            caption={
              latestBodyweight && previousBodyweight
                ? `${formatSignedPercentage(bodyweightDelta)} vs previous entry`
                : 'Log bodyweight to start tracking changes.'
            }
            accent="#0f766e"
          />
        </View>

        <View style={[styles.gridItem, { width: columnWidth }]}>
          <DashboardMetricCard
            title="Latest Metric"
            value={formatMetricValue(latestPerformance)}
            caption={
              latestPerformance
                ? `${latestPerformance.metricName} on ${formatShortDate(latestPerformance.recordedAt)}`
                : 'Save a performance metric to see it here.'
            }
            accent="#ea580c"
          />
        </View>

        <View style={[styles.gridItem, { width: columnWidth }]}>
          <DashboardMetricCard
            title="Bodyweight Average"
            value={
              bodyweightEntries.length > 0
                ? `${getAverage(bodyweightEntries.map((item) => item.weight)).toFixed(1)} lb`
                : '--'
            }
            caption="Across your most recent bodyweight entries"
            accent="#059669"
          />
        </View>

        <View style={[styles.gridItem, { width: columnWidth }]}>
          <DashboardMetricCard
            title="Performance Trend"
            value={performanceEntries.length > 0 ? formatSignedPercentage(performanceDelta) : '--'}
            caption={
              performanceEntries.length > 1
                ? 'Compared with your earliest loaded metric'
                : 'Add more than one metric to show a trend.'
            }
            accent="#7c3aed"
          />
        </View>

        <View style={[styles.gridItem, { width: columnWidth }]}>
          <DashboardMetricCard
            title="Latest Session"
            value={latestWorkout ? formatLongDate(latestWorkout.performedAt) : '--'}
            caption={latestWorkout?.title ?? 'No recent workout saved yet.'}
            accent="#b45309"
          />
        </View>

        <View style={[styles.gridItem, styles.gridItemFull]}>
          <ChartCard
            title="Bodyweight Trend"
            subtitle={
              bodyweightEntries.length > 0
                ? `${bodyweightEntries.length} recent entries`
                : 'No bodyweight entries yet'
            }
            data={bodyweightChartData}
            footer="Track weight changes over time with date-based entries."
          />
        </View>

        <View style={[styles.gridItem, styles.gridItemFull]}>
          <ChartCard
            title="Performance Trend"
            subtitle="Workout-linked lifts and standalone metric logs"
            data={performanceChartData}
            footer="Metrics are plotted from your most recent performance entries."
          />
        </View>

        <View style={[styles.gridItem, styles.gridItemFull]}>
          <Card style={styles.activityCard}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionSubtitle}>
              Latest workouts and performance entries pulled from Supabase.
            </Text>

            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <View key={item.id} style={styles.activityRow}>
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityDetail}>{item.detail}</Text>
                  </View>
                  <Text style={styles.activityDate}>{formatShortDate(item.timestamp)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No synced activity yet.</Text>
            )}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
  },
  header: {
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
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
  heroCard: {
    gap: 10,
    backgroundColor: '#fff7ed',
    borderColor: '#f2d8b5',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  heroText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4b5563',
  },
  heroBadge: {
    minWidth: 92,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#111827',
    gap: 2,
  },
  heroBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#93c5fd',
  },
  heroBadgeValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f9fafb',
  },
  heroHint: {
    fontSize: 13,
    color: '#6b7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  gridItem: {
    minWidth: 0,
  },
  gridItemFull: {
    width: '100%',
  },
  metricCard: {
    minHeight: 148,
    gap: 10,
  },
  metricAccent: {
    width: 46,
    height: 6,
    borderRadius: 999,
  },
  metricTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: '#111827',
  },
  metricCaption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  activityCard: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  activityCopy: {
    flex: 1,
    gap: 2,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  activityDetail: {
    fontSize: 14,
    color: '#4b5563',
  },
  activityDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6b7280',
  },
});
