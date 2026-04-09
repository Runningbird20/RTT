import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { PerformanceFormValues } from '@/lib/types';

type PerformanceFormProps = {
  onSubmit?: (values: PerformanceFormValues) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

const initialValues: PerformanceFormValues = {
  exercise: '',
  sets: '',
  reps: '',
  load: '',
  notes: '',
};

export default function PerformanceForm({
  onSubmit,
  disabled = false,
  helperText,
}: PerformanceFormProps) {
  const [values, setValues] = useState<PerformanceFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = <K extends keyof PerformanceFormValues>(
    key: K,
    value: PerformanceFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (disabled || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (onSubmit) {
        await onSubmit(values);
        setValues(initialValues);
        Alert.alert('Performance saved', `${values.exercise || 'Exercise'} synced to Supabase.`);
      } else {
        Alert.alert('Performance saved', `${values.exercise || 'Exercise'} has been logged locally.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save performance entry.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSubmitting(false);
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

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Button
        title={isSubmitting ? 'Saving...' : 'Save Performance'}
        onPress={handleSubmit}
        disabled={disabled || isSubmitting}
      />
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
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
});
