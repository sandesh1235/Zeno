import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../../styles';
import { fromKg, formatNumber, type WeightUnit } from '../../lib/units';
import type { ActiveSet } from '../../screens/WorkoutScreen';
import { Stepper } from './Stepper';
import { ValuePickerSheet, type PickerKind } from './ValuePickerSheet';

const parse = (raw: string): number | null => (raw === '' ? null : Number(raw));

export function SetRow({ index, set, unit, onEdit }: {
  index: number;
  set: ActiveSet;
  unit: WeightUnit;
  onEdit: (field: keyof ActiveSet, value: string | boolean) => void;
}) {
  const [openPicker, setOpenPicker] = useState<PickerKind | null>(null);

  const weight = parse(set.weight);
  const reps = parse(set.reps);
  const rpe = parse(set.rpe);
  const pickerValue = openPicker === 'weight' ? weight : openPicker === 'reps' ? reps : rpe;

  return <View style={styles.setRow}>
    <Text style={styles.setNum}>{index + 1}</Text>
    <View style={styles.setStepperGroup}>
      <Stepper
        value={weight} step={2.5} min={0} max={300} fallback={20}
        format={kg => formatNumber(fromKg(kg, unit))}
        onChange={next => onEdit('weight', String(next))}
        onPressValue={() => setOpenPicker('weight')}
      />
      <Stepper
        value={reps} step={1} min={1} max={50} fallback={10}
        onChange={next => onEdit('reps', String(next))}
        onPressValue={() => setOpenPicker('reps')}
      />
      <Stepper
        value={rpe} step={0.5} min={5} max={10} fallback={8}
        onChange={next => onEdit('rpe', String(next))}
        onPressValue={() => setOpenPicker('rpe')}
      />
    </View>
    <Pressable onPress={() => onEdit('done', !set.done)} style={[styles.check, set.done && styles.checkOn]}>
      <Text>{set.done ? '✓' : ''}</Text>
    </Pressable>
    <ValuePickerSheet
      visible={openPicker !== null}
      kind={openPicker ?? 'weight'}
      unit={unit}
      value={pickerValue}
      onSelect={next => { if (openPicker) onEdit(openPicker, String(next)); }}
      onClose={() => setOpenPicker(null)}
    />
  </View>;
}
