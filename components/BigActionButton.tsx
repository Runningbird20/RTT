import { Alert, StyleSheet, Text, View } from 'react-native';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

type BigActionButtonProps = {
  title: string;
  description?: string;
  onPress?: () => void;
};

export default function BigActionButton({
  title,
  description,
  onPress,
}: BigActionButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }

    Alert.alert('Next step', 'Open the Log tab to start capturing a new entry.');
  };

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <Text style={styles.kicker}>QUICK ACTION</Text>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Button title="Open" onPress={handlePress} variant="dark" />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  content: {
    gap: 6,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#93c5fd',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f9fafb',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#d1d5db',
  },
});
