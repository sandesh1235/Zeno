import { Pressable, Text, TextInput, View } from 'react-native';
import { C } from '../../theme';
import { styles } from '../../styles';
import type { ActiveSet } from '../../screens/WorkoutScreen';

export function SetRow({ index, set, onEdit }: {
  index: number;
  set: ActiveSet;
  onEdit: (field: keyof ActiveSet, value: string | boolean) => void;
}) {
  return <View style={styles.setRow}>
    <Text style={styles.setNum}>{index + 1}</Text>
    {(['weight', 'reps', 'rpe'] as const).map(f =>
      <TextInput key={f} value={set[f]} onChangeText={v => onEdit(f, v)}
        keyboardType="decimal-pad" placeholder="–" placeholderTextColor={C.muted}
        style={styles.setInput} />
    )}
    <Pressable onPress={() => onEdit('done', !set.done)} style={[styles.check, set.done && styles.checkOn]}>
      <Text>{set.done ? '✓' : ''}</Text>
    </Pressable>
  </View>;
}
