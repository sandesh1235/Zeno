import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { styles } from '../../styles';
import { C } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 64;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RestTimer({ visible, remainingSec, totalSec, onSkip }: {
  visible: boolean;
  remainingSec: number;
  totalSec: number;
  onSkip: () => void;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: totalSec * 1000, useNativeDriver: false }).start();
    } else {
      progress.stopAnimation();
    }
  }, [visible, totalSec]);

  if (!visible) return null;

  const strokeDashoffset = progress.interpolate({ inputRange: [0, 1], outputRange: [0, CIRCUMFERENCE] });

  return <View style={styles.restTimer}>
    <View style={styles.restTimerRing}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={C.panel2} strokeWidth={STROKE} fill="none" />
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={RADIUS}
          stroke={C.lime} strokeWidth={STROKE} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          originX={SIZE / 2}
          originY={SIZE / 2}
        />
      </Svg>
      <Text style={styles.restTimerText}>{remainingSec}</Text>
    </View>
    <Text style={styles.restTimerLabel}>REST</Text>
    <Pressable style={styles.restTimerSkip} onPress={onSkip}><Text style={styles.restTimerSkipText}>SKIP</Text></Pressable>
  </View>;
}
