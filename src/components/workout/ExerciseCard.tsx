import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import type { Exercise } from '../../data';
import type { WeightUnit } from '../../lib/units';
import { styles } from '../../styles';
import type { ActiveSet } from '../../screens/WorkoutScreen';
import type { ExerciseSummary } from '../../lib/workoutHistory';
import { SetRow } from './SetRow';
import { PreviousSummary } from './PreviousSummary';

export function ExerciseCard({ exercise, unit, sets, summary, onEditSet }: {
  exercise: Exercise;
  unit: WeightUnit;
  sets: ActiveSet[];
  summary: ExerciseSummary;
  onEditSet: (setIndex: number, field: keyof ActiveSet, value: string | boolean) => void;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start(); }, [fade]);

  return <Animated.View style={[styles.exercise, { opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}>
    <Text style={styles.exerciseName}>{exercise.name}</Text>
    <Text style={styles.exerciseSub}>{exercise.muscle} · {exercise.sets} × {exercise.reps}</Text>
    <PreviousSummary summary={summary} unit={unit} />
    <View style={styles.setHeader}>
      <Text style={styles.setHeaderSet}>SET</Text>
      <View style={styles.setStepperGroup}>
        <Text style={styles.setHeaderValue}>{unit.toUpperCase()}</Text>
        <Text style={styles.setHeaderValue}>REPS</Text>
        <Text style={styles.setHeaderValue}>RPE</Text>
      </View>
      <View style={styles.setHeaderCheck} />
    </View>
    {sets.map((set, i) => <SetRow key={i} index={i} set={set} unit={unit} isActive={i === sets.findIndex(s => !s.done)} onEdit={(field, value) => onEditSet(i, field, value)} />)}
  </Animated.View>;
}
