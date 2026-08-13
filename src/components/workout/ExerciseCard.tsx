import { Text, View } from 'react-native';
import type { Exercise } from '../../data';
import type { WeightUnit } from '../../lib/units';
import { styles } from '../../styles';
import type { ActiveSet } from '../../screens/WorkoutScreen';
import { SetRow } from './SetRow';

export function ExerciseCard({ exercise, unit, sets, onEditSet }: {
  exercise: Exercise;
  unit: WeightUnit;
  sets: ActiveSet[];
  onEditSet: (setIndex: number, field: keyof ActiveSet, value: string | boolean) => void;
}) {
  return <View style={styles.exercise}>
    <Text style={styles.routineName}>{exercise.name}</Text>
    <Text style={styles.sub}>{exercise.muscle} · {exercise.sets} × {exercise.reps}</Text>
    <View style={styles.setHeader}>
      <Text>SET</Text><Text>{unit.toUpperCase()}</Text><Text>REPS</Text><Text>RPE</Text><Text>DONE</Text>
    </View>
    {sets.map((set, i) => <SetRow key={i} index={i} set={set} unit={unit} onEdit={(field, value) => onEditSet(i, field, value)} />)}
  </View>;
}
