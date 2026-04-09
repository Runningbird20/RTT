import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { PerformanceFormValues } from '@/lib/types';

type PerformanceFormProps = {
  onSubmit?: (values: PerformanceFormValues) => void;
};

export default function PerformanceForm({ onSubmit }: PerformanceFormProps) {
  const [values, setValues] = useState<PerformanceFormValues>({
    exercise: '',
    sets: '',
    reps: '',
    load: '',
    notes: '',
  });

  const updateValue = <K extends keyof PerformanceFormValues>(
    key: K,
    value: PerformanceFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      Alert.alert('Performance saved', `${values.exercise || 'Exercise'} has been logged locally.`);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Performance</Text>

      <Input
        label="Exercise"
        placeholder="Bench press"
        value={values.exercise}
        onChangeText={(text) => updateValue('exercise', text)}
      />

      <View style={styles.row}>
        <View style={styles.field}>
          <Input
            label="Sets"
            placeholder="4"
            keyboardType="number-pad"
            value={values.sets}
            onChangeText={(text) => updateValue('sets', text)}
          />
        </View>

        <View style={styles.field}>
          <Input
            label="Reps"
            placeholder="6"
            keyboardType="number-pad"
            value={values.reps}
            onChangeText={(text) => updateValue('reps', text)}
          />
        </View>
      </View>

      <Input
        label="Load"
        placeholder="205"
        keyboardType="decimal-pad"
        value={values.load}
        onChangeText={(text) => updateValue('load', text)}
      />

      <Input
        label="Notes"
        placeholder="RPE, tempo, and technique notes"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={styles.multiline}
        value={values.notes}
        onChangeText={(text) => updateValue('notes', text)}
      />

      <Button title="Save Performance" onPress={handleSubmit} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
  },
  multiline: {
    minHeight: 100,
  },
});
