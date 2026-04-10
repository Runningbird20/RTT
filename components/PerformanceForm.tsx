import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { PerformanceMetricFormValues } from '@/lib/types';

type PerformanceFormProps = {
  onSubmit?: (values: PerformanceMetricFormValues) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

const initialValues: PerformanceMetricFormValues = {
  metricType: '',
  value: '',
  unit: '',
};

const unitOptions = [
  { label: 'Seconds', value: 'sec' },
  { label: 'Minutes', value: 'min' },
  { label: 'Reps', value: 'reps' },
  { label: 'Pounds', value: 'lb' },
  { label: 'Kilograms', value: 'kg' },
  { label: 'Meters', value: 'm' },
  { label: 'Kilometers', value: 'km' },
  { label: 'Miles', value: 'mi' },
  { label: 'Watts', value: 'watts' },
  { label: 'Calories', value: 'kcal' },
  { label: 'Rounds', value: 'rounds' },
  { label: 'No unit', value: '' },
] as const;

export default function PerformanceForm({
  onSubmit,
  disabled = false,
  helperText,
}: PerformanceFormProps) {
  const [values, setValues] = useState<PerformanceMetricFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);

  const updateValue = <K extends keyof PerformanceMetricFormValues>(
    key: K,
    value: PerformanceMetricFormValues[K]
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
        setIsUnitMenuOpen(false);
        Alert.alert('Performance saved', `${values.metricType || 'Metric'} synced to Supabase.`);
      } else {
        Alert.alert('Performance saved', `${values.metricType || 'Metric'} has been logged locally.`);
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
      <Text style={styles.title}>Performance Metric</Text>

      <Input
        label="Metric type"
        placeholder="10m sprint"
        value={values.metricType}
        onChangeText={(text) => updateValue('metricType', text)}
      />

      <Input
        label="Value"
        placeholder="1.82"
        keyboardType="decimal-pad"
        value={values.value}
        onChangeText={(text) => updateValue('value', text)}
      />

      <View style={styles.group}>
        <Text style={styles.label}>Unit</Text>
        <Pressable
          onPress={() => {
            if (disabled || isSubmitting) {
              return;
            }

            setIsUnitMenuOpen((current) => !current);
          }}
          style={[styles.selectField, (disabled || isSubmitting) && styles.selectFieldDisabled]}>
          <Text style={[styles.selectValue, !values.unit && styles.selectPlaceholder]}>
            {values.unit || 'Select a unit'}
          </Text>
          <Text style={styles.selectAction}>{isUnitMenuOpen ? 'Hide' : 'Choose'}</Text>
        </Pressable>

        {isUnitMenuOpen ? (
          <View style={styles.optionsGrid}>
            {unitOptions.map((option) => {
              const isSelected = values.unit === option.value;

              return (
                <Pressable
                  key={option.label}
                  onPress={() => {
                    updateValue('unit', option.value);
                    setIsUnitMenuOpen(false);
                  }}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}>
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

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
  group: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  selectField: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectFieldDisabled: {
    opacity: 0.45,
  },
  selectValue: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  selectPlaceholder: {
    color: '#9ca3af',
  },
  selectAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    backgroundColor: '#ffffff',
  },
  optionChipSelected: {
    borderColor: '#0f766e',
    backgroundColor: '#d8f3ed',
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextSelected: {
    color: '#0f766e',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
});
