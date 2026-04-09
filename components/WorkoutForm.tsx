import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { WorkoutFormValues, WorkoutIntensity } from '@/lib/types';

type WorkoutFormProps = {
  onSubmit?: (values: WorkoutFormValues) => void;
};

const intensities: WorkoutIntensity[] = ['Easy', 'Moderate', 'Hard'];

export default function WorkoutForm({ onSubmit }: WorkoutFormProps) {
  const [values, setValues] = useState<WorkoutFormValues>({
    workoutName: '',
    durationMinutes: '',
    intensity: 'Moderate',
    notes: '',
  });

  const updateValue = <K extends keyof WorkoutFormValues>(key: K, value: WorkoutFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      Alert.alert('Workout saved', `${values.workoutName || 'Session'} has been captured locally.`);
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

      <Button title="Save Workout" onPress={handleSubmit} variant="dark" />
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
});
