import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'dark';
};

const variantStyles = {
  primary: {
    backgroundColor: '#1d4ed8',
    textColor: '#ffffff',
  },
  secondary: {
    backgroundColor: '#0f766e',
    textColor: '#ffffff',
  },
  dark: {
    backgroundColor: '#111827',
    textColor: '#ffffff',
  },
} as const;

export default function Button({
  title,
  onPress,
  variant = 'primary',
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: variantStyles[variant].backgroundColor },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.text, { color: variantStyles[variant].textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.92,
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
  },
});
