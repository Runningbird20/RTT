import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

import ChartCard from '@/components/ChartCard';
import StatCard from '@/components/StatCard';
import Card from '@/components/ui/Card';
import { formatSignedPercentage, getAverage, getPercentageChange } from '@/lib/calculations';
import { getSupabaseSetupMessage } from '@/lib/supabase';
import { fetchRecentBodyweightEntries, fetchRecentPerformanceEntries } from '@/lib/training';
import { useSupabaseSession } from '@/lib/useSupabaseSession';
import type { BodyweightEntryRecord, ChartPoint, PerformanceEntryRecord } from '@/lib/types';

function formatShortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function ProgressScreen() {
  const isFocused = useIsFocused();
  const { session, isLoadingSession, isSupabaseConfigured } = useSupabaseSession();
  const [bodyweightEntries, setBodyweightEntries] = useState<BodyweightEntryRecord[]>([]);
  const [performanceEntries, setPerformanceEntries] = useState<PerformanceEntryRecord[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [message, setMessage] = useState(getSupabaseSetupMessage());

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      if (!isFocused || isLoadingSession) {
        return;
      }

      if (!isSupabaseConfigured) {
        if (isMounted) {
          setBodyweightEntries([]);
          setPerformanceEntries([]);
          setMessage(getSupabaseSetupMessage());
        }
        return;
      }

      if (!session) {
        if (isMounted) {
          setBodyweightEntries([]);
          setPerformanceEntries([]);
          setMessage('Sign in on the Profile tab to load progress charts from Supabase.');
        }
        return;
      }

      try {
        setIsLoadingProgress(true);
        const [weights, performances] = await Promise.all([
          fetchRecentBodyweightEntries(session, 8),
          fetchRecentPerformanceEntries(session, 8),
        ]);

        if (!isMounted) {
          return;
        }

        setBodyweightEntries(weights);
        setPerformanceEntries(performances);
        setMessage('Bodyweight and performance trends are live from Supabase.');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextMessage = error instanceof Error ? error.message : 'Unable to load progress data.';
        setBodyweightEntries([]);
        setPerformanceEntries([]);
        setMessage(nextMessage);
      } finally {
        if (isMounted) {
          setIsLoadingProgress(false);
        }
      }
    }

    void loadProgress();

    return () => {
      isMounted = false;
    };
  }, [isFocused, isLoadingSession, isSupabaseConfigured, session]);

  const bodyweightChartData: ChartPoint[] = bodyweightEntries.map((entry) => ({
    label: formatShortDate(`${entry.entryDate}T12:00:00`),
    value: entry.weight,
  }));
  const performanceChartData: ChartPoint[] = performanceEntries.map((entry) => ({
    label: formatShortDate(entry.recordedAt),
    value: entry.weight ?? entry.value,
  }));

  const latestBodyweight = bodyweightEntries.at(-1)?.weight ?? 0;
  const baselineBodyweight = bodyweightEntries[0]?.weight ?? 0;
  const bodyweightDelta = getPercentageChange(baselineBodyweight, latestBodyweight);

  const latestPerformance = performanceEntries.at(-1)?.weight ?? performanceEntries.at(-1)?.value ?? 0;
  const baselinePerformance = performanceEntries[0]?.weight ?? performanceEntries[0]?.value ?? 0;
  const strengthDelta = getPercentageChange(baselinePerformance, latestPerformance);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>Bodyweight and performance trends synced from Supabase.</Text>
      </View>

      <Card style={styles.messageCard}>
        <Text style={styles.messageTitle}>Progress sync</Text>
        <Text style={styles.messageText}>{message}</Text>
        {isLoadingProgress ? <Text style={styles.messageHint}>Refreshing progress...</Text> : null}
      </Card>

      <View style={styles.statsRow}>
        <StatCard
          title="Bodyweight"
          value={latestBodyweight > 0 ? `${latestBodyweight.toFixed(1)} lb` : '--'}
          caption={
            bodyweightEntries.length > 1
              ? `${formatSignedPercentage(bodyweightDelta)} across ${bodyweightEntries.length} entries`
              : 'Log bodyweight entries to see a trend.'
          }
          accent="#0f766e"
        />
        <StatCard
          title="Latest Performance"
          value={latestPerformance > 0 ? `${latestPerformance.toFixed(1)}` : '--'}
          caption={
            performanceEntries.length > 1
              ? `${formatSignedPercentage(strengthDelta)} over baseline`
              : 'Log performance entries to build a chart.'
          }
        />
      </View>

      <ChartCard
        title="Bodyweight Trend"
        subtitle={
          bodyweightEntries.length > 0
            ? `Average: ${getAverage(bodyweightEntries.map((item) => item.weight)).toFixed(1)} lb`
            : 'No bodyweight entries yet'
        }
        data={bodyweightChartData}
      />

      <ChartCard
        title="Performance Trend"
        subtitle="Recent saved performance metrics"
        data={performanceChartData}
        footer="Performance entries include workout-linked lifts and standalone metric logs."
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
