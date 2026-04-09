import { ScrollView, StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import type { WorkoutEntry } from '@/lib/types';

const history: WorkoutEntry[] = [
  {
    id: '1',
    title: 'Lower Body Strength',
    date: 'Apr 7, 2026',
    durationMinutes: 68,
    intensity: 'Hard',
    notes: 'Front squat focus with accessory work.',
  },
  {
    id: '2',
    title: 'Upper Body Volume',
    date: 'Apr 5, 2026',
    durationMinutes: 54,
    intensity: 'Moderate',
    notes: 'Bench press plus rows and pull-ups.',
  },
  {
    id: '3',
    title: 'Conditioning',
    date: 'Apr 3, 2026',
    durationMinutes: 32,
    intensity: 'Easy',
    notes: 'Zone 2 bike session.',
  },
];

export default function HistoryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Recent sessions appear here once your logs start filling in.</Text>
      </View>

      {history.map((entry) => (
        <Card key={entry.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardTitle}>{entry.title}</Text>
            <Text style={styles.badge}>{entry.intensity}</Text>
          </View>
          <Text style={styles.meta}>
            {entry.date} - {entry.durationMinutes} min
          </Text>
          <Text style={styles.notes}>{entry.notes}</Text>
        </Card>
      ))}
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
