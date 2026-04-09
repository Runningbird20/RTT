import { ScrollView, StyleSheet, Text, View } from 'react-native';

import BodyweightForm from '@/components/BodyweightForm';
import PerformanceForm from '@/components/PerformanceForm';
import WorkoutForm from '@/components/WorkoutForm';

export default function LogScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Log a new entry</Text>
        <Text style={styles.subtitle}>
          Start with the training session, then capture bodyweight and performance details if you
          want a fuller snapshot.
        </Text>
      </View>

      <WorkoutForm />
      <BodyweightForm />
      <PerformanceForm />
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
});
