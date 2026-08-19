import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { styles } from '../../styles';

export function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? completed / total : 0;
  const widthAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAnim, { toValue: pct, duration: 300, useNativeDriver: false }).start();
  }, [pct]);

  return <View style={styles.progressBarRow}>
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
    </View>
    <Text style={styles.progressLabel}>{completed}/{total} exercises</Text>
  </View>;
}
