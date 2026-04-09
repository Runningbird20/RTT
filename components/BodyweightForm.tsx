import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { BodyweightFormValues } from '@/lib/types';

type BodyweightFormProps = {
  onSubmit?: (values: BodyweightFormValues) => void;
};

export default function BodyweightForm({ onSubmit }: BodyweightFormProps) {
  const [values, setValues] = useState<BodyweightFormValues>({
    weight: '',
    measuredAt: '',
    notes: '',
  });

  const updateValue = <K extends keyof BodyweightFormValues>(
    key: K,
    value: BodyweightFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(values);
    } else {
      Alert.alert('Bodyweight saved', `${values.weight || 'New'} entry captured locally.`);
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

      <Button title="Save Bodyweight" onPress={handleSubmit} variant="secondary" />
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
});
