import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';

type StatCardProps = {
  title: string;
  value: string;
  caption?: string;
  accent?: string;
};

export default function StatCard({
  title,
  value,
  caption,
  accent = '#1d4ed8',
}: StatCardProps) {
  return (
    <Card style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 150,
    gap: 10,
  },
  accent: {
    width: 44,
    height: 6,
    borderRadius: 999,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  value: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
});
