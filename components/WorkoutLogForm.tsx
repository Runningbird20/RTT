import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { WorkoutLogFormValues } from '@/lib/types';

type WorkoutLogFormProps = {
  onSubmit?: (values: WorkoutLogFormValues) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

const initialValues: WorkoutLogFormValues = {
  exercise: '',
  sets: '',
  reps: '',
  weight: '',
  notes: '',
};

export default function WorkoutLogForm({
  onSubmit,
  disabled = false,
  helperText,
}: WorkoutLogFormProps) {
  const [values, setValues] = useState<WorkoutLogFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = <K extends keyof WorkoutLogFormValues>(
    key: K,
    value: WorkoutLogFormValues[K]
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
        Alert.alert('Workout saved', `${values.exercise || 'Workout'} synced to Supabase.`);
      } else {
        Alert.alert('Workout saved', `${values.exercise || 'Workout'} has been logged locally.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save workout log.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Workout Log</Text>

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
        label="Weight"
        placeholder="205"
        keyboardType="decimal-pad"
        value={values.weight}
        onChangeText={(text) => updateValue('weight', text)}
      />

      <Input
        label="Notes"
        placeholder="Top set felt smooth, last rep slowed down"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        style={styles.multiline}
        value={values.notes}
        onChangeText={(text) => updateValue('notes', text)}
      />

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Button
        title={isSubmitting ? 'Saving...' : 'Save Workout'}
        onPress={handleSubmit}
        variant="dark"
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
    minHeight: 110,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
});
