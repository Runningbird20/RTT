import { ScrollView, StyleSheet, Text, View } from 'react-native';

import ChartCard from '@/components/ChartCard';
import StatCard from '@/components/StatCard';
import { formatSignedPercentage, getAverage, getPercentageChange } from '@/lib/calculations';

const bodyweightTrend = [
  { label: 'W1', value: 182 },
  { label: 'W2', value: 181 },
  { label: 'W3', value: 180 },
  { label: 'W4', value: 179 },
  { label: 'W5', value: 178 },
];

const strengthTrend = [
  { label: 'W1', value: 185 },
  { label: 'W2', value: 195 },
  { label: 'W3', value: 200 },
  { label: 'W4', value: 205 },
  { label: 'W5', value: 210 },
];

export default function ProgressScreen() {
  const bodyweightDelta = getPercentageChange(bodyweightTrend[0].value, bodyweightTrend.at(-1)?.value ?? 0);
  const strengthDelta = getPercentageChange(strengthTrend[0].value, strengthTrend.at(-1)?.value ?? 0);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
        <Text style={styles.subtitle}>A quick snapshot of bodyweight and performance trends.</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Bodyweight"
          value={`${bodyweightTrend.at(-1)?.value ?? 0} lb`}
          caption={`${formatSignedPercentage(bodyweightDelta)} across 5 weeks`}
          accent="#0f766e"
        />
        <StatCard
          title="Bench Top Set"
          value={`${strengthTrend.at(-1)?.value ?? 0} lb`}
          caption={`${formatSignedPercentage(strengthDelta)} over baseline`}
        />
      </View>

      <ChartCard
        title="Bodyweight Trend"
        subtitle={`Average: ${getAverage(bodyweightTrend.map((item) => item.value)).toFixed(1)} lb`}
        data={bodyweightTrend}
      />

      <ChartCard
        title="Strength Trend"
        subtitle="Top set progression"
        data={strengthTrend}
        footer="Replace these samples with exercise-specific history as your schema solidifies."
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
