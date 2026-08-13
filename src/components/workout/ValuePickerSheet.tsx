import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Modal, Pressable, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { styles } from '../../styles';
import { fromKg, formatNumber, type WeightUnit } from '../../lib/units';

export type PickerKind = 'weight' | 'reps' | 'rpe';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;

function optionsFor(kind: PickerKind): number[] {
  if (kind === 'weight') return Array.from({ length: 121 }, (_, i) => Math.round(i * 2.5 * 10) / 10);
  if (kind === 'reps') return Array.from({ length: 50 }, (_, i) => i + 1);
  return Array.from({ length: 11 }, (_, i) => Math.round((5 + i * 0.5) * 10) / 10);
}

function labelFor(kind: PickerKind, value: number, unit: WeightUnit): string {
  return kind === 'weight' ? formatNumber(fromKg(value, unit)) : formatNumber(value);
}

function titleFor(kind: PickerKind, unit: WeightUnit): string {
  if (kind === 'weight') return `WEIGHT (${unit.toUpperCase()})`;
  if (kind === 'reps') return 'REPS';
  return 'RPE';
}

function nearestIndex(options: number[], value: number | null): number {
  if (value === null) return 0;
  let best = 0;
  let bestDiff = Infinity;
  options.forEach((option, i) => {
    const diff = Math.abs(option - value);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}

export function ValuePickerSheet({ visible, kind, unit, value, onSelect, onClose }: {
  visible: boolean;
  kind: PickerKind;
  unit: WeightUnit;
  value: number | null;
  onSelect: (value: number) => void;
  onClose: () => void;
}) {
  const options = optionsFor(kind);
  const [mounted, setMounted] = useState(visible);
  const [selectedIndex, setSelectedIndex] = useState(() => nearestIndex(options, value));
  const anim = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<number>>(null);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const idx = nearestIndex(options, value);
      setSelectedIndex(idx);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: idx * ITEM_HEIGHT, animated: false }));
    } else {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  const commit = (index: number) => { onSelect(options[index]); onClose(); };
  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    setSelectedIndex(Math.max(0, Math.min(options.length - 1, idx)));
  };

  return <Modal transparent visible animationType="none" onRequestClose={onClose}>
    <View style={styles.sheetRoot}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: anim, pointerEvents: 'none' }]} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [WHEEL_HEIGHT + 80, 0] }) }] }]}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{titleFor(kind, unit)}</Text>
          <Pressable onPress={() => commit(selectedIndex)}><Text style={styles.sheetDone}>DONE</Text></Pressable>
        </View>
        <View style={styles.sheetWheel}>
          <View style={[styles.sheetSelectionWindow, { pointerEvents: 'none' }]} />
          <FlatList
            ref={listRef}
            data={options}
            keyExtractor={item => String(item)}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
            contentContainerStyle={{ paddingVertical: (WHEEL_HEIGHT - ITEM_HEIGHT) / 2 }}
            onMomentumScrollEnd={onScrollEnd}
            onScrollEndDrag={onScrollEnd}
            style={{ height: WHEEL_HEIGHT }}
            renderItem={({ item, index }) => (
              <Pressable style={styles.sheetRow} onPress={() => commit(index)}>
                <Text style={[styles.sheetRowText, index === selectedIndex && styles.sheetRowTextActive]}>{labelFor(kind, item, unit)}</Text>
              </Pressable>
            )}
          />
        </View>
      </Animated.View>
    </View>
  </Modal>;
}
