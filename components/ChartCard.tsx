import { StyleSheet, Text, View } from 'react-native';

import Card from '@/components/ui/Card';
import type { ChartPoint } from '@/lib/types';

type ChartCardProps = {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  footer?: string;
};

export default function ChartCard({ title, subtitle, data, footer }: ChartCardProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.chart}>
        {data.map((item) => (
          <View key={item.label} style={styles.column}>
            <Text style={styles.value}>{item.value}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    height: Math.max(20, (item.value / maxValue) * 120),
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        ))}
      </View>

      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 180,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  barTrack: {
    width: '100%',
    maxWidth: 40,
    height: 120,
    justifyContent: 'flex-end',
    borderRadius: 999,
    backgroundColor: '#e5ddd0',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  footer: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
});
