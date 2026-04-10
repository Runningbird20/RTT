import { createElement, useState, type CSSProperties } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { BodyweightFormValues } from '@/lib/types';

type BodyweightFormProps = {
  onSubmit?: (values: BodyweightFormValues) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

const webDateInputStyle: CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid #d6d3d1',
  backgroundColor: '#ffffff',
  color: '#111827',
  fontSize: 15,
  boxSizing: 'border-box',
};

function getTodayDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatStorageDate(date: Date): string {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function parseStorageDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return getTodayDate();
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return getTodayDate();
  }

  return parsed;
}

function formatAmericanDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

const initialDate = getTodayDate();
const initialValues: BodyweightFormValues = {
  weight: '',
  entryDate: formatStorageDate(initialDate),
};

export default function BodyweightForm({
  onSubmit,
  disabled = false,
  helperText,
}: BodyweightFormProps) {
  const [values, setValues] = useState<BodyweightFormValues>(initialValues);
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseStorageDate(initialValues.entryDate));
  const [isShowingIosPicker, setIsShowingIosPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValue = <K extends keyof BodyweightFormValues>(
    key: K,
    value: BodyweightFormValues[K]
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const updateDate = (date: Date) => {
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(normalizedDate);
    updateValue('entryDate', formatStorageDate(normalizedDate));
  };

  const openDatePicker = () => {
    if (disabled || isSubmitting) {
      return;
    }

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: 'date',
        display: 'calendar',
        onChange: (_event: DateTimePickerEvent, nextDate?: Date) => {
          if (!nextDate) {
            return;
          }

          updateDate(nextDate);
        },
      });

      return;
    }

    if (Platform.OS === 'ios') {
      setIsShowingIosPicker((current) => !current);
    }
  };

  const handleSubmit = async () => {
    if (disabled || isSubmitting) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (onSubmit) {
        await onSubmit(values);
        const nextDate = getTodayDate();
        setSelectedDate(nextDate);
        setValues({
          weight: '',
          entryDate: formatStorageDate(nextDate),
        });
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

      <View style={styles.dateGroup}>
        <Text style={styles.label}>Date</Text>

        {Platform.OS === 'web' ? (
          <View style={styles.webDateWrapper}>
            {createElement('input', {
              type: 'date',
              value: values.entryDate,
              disabled: disabled || isSubmitting,
              onChange: (event: { target: { value: string } }) => {
                const nextValue = event.target.value;
                updateValue('entryDate', nextValue);
                setSelectedDate(parseStorageDate(nextValue));
              },
              style: webDateInputStyle,
            })}
            <Text style={styles.datePreview}>{formatAmericanDate(selectedDate)}</Text>
          </View>
        ) : (
          <>
            <Pressable
              onPress={openDatePicker}
              style={[styles.dateField, disabled && styles.dateFieldDisabled]}>
              <Text style={styles.dateValue}>{formatAmericanDate(selectedDate)}</Text>
              <Text style={styles.dateAction}>
                {Platform.OS === 'ios' && isShowingIosPicker ? 'Hide calendar' : 'Change'}
              </Text>
            </Pressable>

            {Platform.OS === 'ios' && isShowingIosPicker ? (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="inline"
                onChange={(_event, nextDate) => {
                  if (!nextDate) {
                    return;
                  }

                  updateDate(nextDate);
                }}
              />
            ) : null}
          </>
        )}
      </View>

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
  dateGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
  },
  webDateWrapper: {
    gap: 8,
  },
  dateField: {
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
  dateFieldDisabled: {
    opacity: 0.45,
  },
  dateValue: {
    fontSize: 15,
    color: '#111827',
  },
  dateAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f766e',
  },
  datePreview: {
    fontSize: 13,
    color: '#6b7280',
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
});
