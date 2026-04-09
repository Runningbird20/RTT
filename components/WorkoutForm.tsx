import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { WorkoutFormValues, WorkoutIntensity } from '@/lib/types';

type WorkoutFormProps = {
  onSubmit?: (values: WorkoutFormValues) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

const intensities: WorkoutIntensity[] = ['Easy', 'Moderate', 'Hard'];
const initialValues: WorkoutFormValues = {
  workoutName: '',
  durationMinutes: '',
  intensity: 'Moderate',
  notes: '',
};

export default function WorkoutForm({
  onSubmit,
  disabled = false,
  helperText,
}: WorkoutFormProps) {
  const [values, setValues] = useState<WorkoutFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = <K extends keyof WorkoutFormValues>(key: K, value: WorkoutFormValues[K]) => {
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
        Alert.alert('Workout saved', `${values.workoutName || 'Session'} synced to Supabase.`);
      } else {
        Alert.alert('Workout saved', `${values.workoutName || 'Session'} has been captured locally.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save workout.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Workout</Text>

      <Input
        label="Workout name"
        placeholder="Lower body strength"
        value={values.workoutName}
        onChangeText={(text) => updateValue('workoutName', text)}
      />

      <Input
        label="Duration"
        placeholder="60"
        keyboardType="number-pad"
        value={values.durationMinutes}
        onChangeText={(text) => updateValue('durationMinutes', text)}
      />

      <View style={styles.group}>
        <Text style={styles.label}>Intensity</Text>
        <View style={styles.segmentRow}>
          {intensities.map((intensity) => {
            const selected = values.intensity === intensity;

            return (
              <Pressable
                key={intensity}
                onPress={() => updateValue('intensity', intensity)}
                style={[styles.segment, selected && styles.segmentSelected]}>
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {intensity}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Input
        label="Notes"
        placeholder="Top sets, cues, or recovery notes"
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
  group: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  segmentSelected: {
    borderColor: '#1d4ed8',
    backgroundColor: '#dbeafe',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  segmentTextSelected: {
    color: '#1d4ed8',
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
