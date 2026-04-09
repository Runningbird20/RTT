import { ScrollView, StyleSheet, Text, View } from 'react-native';

import StatCard from '@/components/StatCard';
import Card from '@/components/ui/Card';
import { getSupabaseSetupMessage, isSupabaseConfigured, supportedSupabaseKeyEnvVars } from '@/lib/supabase';

export default function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>
          Use this tab for account details, app settings, and backend setup status.
        </Text>
      </View>

      <StatCard
        title="Supabase"
        value={isSupabaseConfigured ? 'Connected' : 'Pending'}
        caption={getSupabaseSetupMessage()}
        accent={isSupabaseConfigured ? '#0f766e' : '#b45309'}
      />

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Supabase wiring</Text>
        <Text style={styles.item}>The client now lives in utils/supabase.ts and supports AsyncStorage persistence.</Text>
        <Text style={styles.item}>Your key can come from {supportedSupabaseKeyEnvVars.join(', ')}.</Text>
        <Text style={styles.item}>Next: swap the sample todos query for your real workout tables.</Text>
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
  card: {
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
});
