import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { BodyweightFormValues } from '@/lib/types';

type BodyweightFormProps = {
  onSubmit?: (values: BodyweightFormValues) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

const initialValues: BodyweightFormValues = {
  weight: '',
  measuredAt: '',
  notes: '',
};

export default function BodyweightForm({
  onSubmit,
  disabled = false,
  helperText,
}: BodyweightFormProps) {
  const [values, setValues] = useState<BodyweightFormValues>(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = <K extends keyof BodyweightFormValues>(
    key: K,
    value: BodyweightFormValues[K]
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
        Alert.alert('Bodyweight saved', `${values.weight || 'New'} entry synced to Supabase.`);
      } else {
        Alert.alert('Bodyweight saved', `${values.weight || 'New'} entry captured locally.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save bodyweight entry.';
      Alert.alert('Save failed', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Bodyweight</Text>

      <Input
        label="Weight"
        placeholder="180.2"
        keyboardType="decimal-pad"
        value={values.weight}
        onChangeText={(text) => updateValue('weight', text)}
      />

      <Input
        label="Measured at"
        placeholder="Morning"
        value={values.measuredAt}
        onChangeText={(text) => updateValue('measuredAt', text)}
      />

      <Input
        label="Notes"
        placeholder="Hydration, sodium, or sleep context"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        style={styles.multiline}
        value={values.notes}
        onChangeText={(text) => updateValue('notes', text)}
      />

      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}

      <Button
        title={isSubmitting ? 'Saving...' : 'Save Bodyweight'}
        onPress={handleSubmit}
        variant="secondary"
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
  multiline: {
    minHeight: 100,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
});
