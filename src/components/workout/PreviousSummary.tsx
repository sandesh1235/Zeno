import { Text, View } from 'react-native';
import { styles } from '../../styles';
import { showWeight, type WeightUnit } from '../../lib/units';
import type { ExerciseSummary } from '../../lib/workoutHistory';

export function PreviousSummary({ summary, unit }: { summary: ExerciseSummary; unit: WeightUnit }) {
  const parts: string[] = [];
  if (summary.last) parts.push(`Last ${showWeight(summary.last.weight, unit)} × ${summary.last.reps}`);
  if (summary.best) parts.push(`Best ${showWeight(summary.best.weight, unit)} × ${summary.best.reps}`);
  if (summary.lastVolume !== null) parts.push(`Volume ${showWeight(summary.lastVolume, unit)}`);

  return <View style={styles.previousSummary}>
    <Text style={styles.previousSummaryText}>{parts.length > 0 ? parts.join('  ·  ') : 'First time logging this exercise'}</Text>
  </View>;
}
