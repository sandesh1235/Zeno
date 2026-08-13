import { Animated, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { styles } from '../../styles';
import { usePressScale } from '../../hooks/usePressScale';

function StepperButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { scale, onPressIn, onPressOut } = usePressScale();
  return (
    <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View style={[styles.setStepperBtn, { transform: [{ scale }] }]}>
        <Text style={styles.setStepperBtnText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Stepper({ value, onChange, step, min, max, fallback, format, onPressValue, style }: {
  value: number | null;
  onChange: (next: number) => void;
  step: number;
  min: number;
  max: number;
  fallback: number;
  format?: (v: number) => string;
  onPressValue?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const stepBy = (dir: 1 | -1) => {
    const base = value ?? fallback;
    const next = Math.round((base + step * dir) / step) * step;
    const rounded = Math.round(next * 100) / 100;
    onChange(Math.min(max, Math.max(min, rounded)));
  };
  const display = value === null ? '–' : format ? format(value) : String(value);

  return <View style={[styles.setStepper, style]}>
    <StepperButton label="−" onPress={() => stepBy(-1)} />
    <Pressable style={styles.setStepperValue} onPress={onPressValue} disabled={!onPressValue}>
      <Text style={styles.setStepperValueText}>{display}</Text>
    </Pressable>
    <StepperButton label="+" onPress={() => stepBy(1)} />
  </View>;
}
