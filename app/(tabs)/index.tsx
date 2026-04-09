import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import BigActionButton from '@/components/BigActionButton';
import ChartCard from '@/components/ChartCard';
import StatCard from '@/components/StatCard';
import Card from '@/components/ui/Card';
import { formatSignedPercentage, getAverage, getPercentageChange } from '@/lib/calculations';
import { getSupabaseSetupMessage, supabase } from '@/lib/supabase';

const weeklyLoads = [
  { label: 'Mon', value: 14 },
  { label: 'Tue', value: 18 },
  { label: 'Wed', value: 17 },
  { label: 'Thu', value: 21 },
  { label: 'Fri', value: 24 },
];

type Todo = {
  id: number;
  name: string;
};

export default function HomeScreen() {
  const currentSessions = 5;
  const previousSessions = 4;
  const sessionDelta = getPercentageChange(previousSessions, currentSessions);
  const averageLoad = getAverage(weeklyLoads.map((item) => item.value));
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [todoMessage, setTodoMessage] = useState('Connecting to Supabase...');

  useEffect(() => {
    let isMounted = true;

    async function loadTodos() {
      if (!supabase) {
        if (isMounted) {
          setTodoMessage(getSupabaseSetupMessage());
          setIsLoadingTodos(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.from('todos').select('id, name').limit(5);

        if (!isMounted) {
          return;
        }

        if (error) {
          setTodos([]);
          setTodoMessage(`Sample query failed: ${error.message}`);
        } else if (data && data.length > 0) {
          setTodos(data as Todo[]);
          setTodoMessage('Live data from your Supabase todos table.');
        } else {
          setTodos([]);
          setTodoMessage('Connected successfully. No todos found yet.');
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        setTodoMessage(`Sample query failed: ${message}`);
      } finally {
        if (isMounted) {
          setIsLoadingTodos(false);
        }
      }
    }

    void loadTodos();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>READY TO TRAIN</Text>
        <Text style={styles.title}>Home</Text>
        <Text style={styles.subtitle}>
          Your starter dashboard is now connected for real Supabase-backed reads alongside the mock
          training data.
        </Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          title="Weekly Sessions"
          value={String(currentSessions)}
          caption={`${formatSignedPercentage(sessionDelta)} vs last week`}
        />
        <StatCard
          title="Average Load"
          value={`${averageLoad.toFixed(1)}k`}
          caption="Based on this week's entries"
          accent="#0f766e"
        />
      </View>

      <BigActionButton
        title="Log today's workout"
        description="Jump into the log tab to add a session, bodyweight update, or performance note."
      />

      <ChartCard
        title="Training Load"
        subtitle="Mock weekly volume"
        data={weeklyLoads}
        footer="Swap this sample series for real progress data from your backend."
      />

      <Card style={styles.todoCard}>
        <Text style={styles.todoTitle}>Supabase Todo Preview</Text>
        <Text style={styles.todoSubtitle}>{todoMessage}</Text>

        {isLoadingTodos ? <Text style={styles.todoItem}>Loading...</Text> : null}

        {!isLoadingTodos && todos.length === 0 ? (
          <Text style={styles.todoItem}>No rows to display.</Text>
        ) : null}

        {!isLoadingTodos &&
          todos.map((item) => (
            <Text key={item.id} style={styles.todoItem}>
              {item.name}
            </Text>
          ))}
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
  todoCard: {
    gap: 10,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  todoSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  todoItem: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f2937',
  },
});
