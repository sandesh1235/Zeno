import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C } from '../theme';
import { styles } from '../styles';
import { getWorkoutStreaks } from '../lib/streaks';
import type { ExerciseHistory } from '../types/history';

type Props = {
  history: ExerciseHistory;
  now?: Date;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const startOfMonthGrid = (date: Date) => {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  first.setDate(first.getDate() - mondayOffset);
  first.setHours(0, 0, 0, 0);
  return first;
};

const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function StreakCalendar({ history, now = new Date() }: Props) {
  const [monthOffset, setMonthOffset] = useState(0);
  const month = useMemo(() => new Date(now.getFullYear(), now.getMonth() + monthOffset, 1), [now, monthOffset]);
  const { workoutDays, currentStreak, longestStreak } = useMemo(() => getWorkoutStreaks(history, now), [history, now]);
  const workoutSet = useMemo(() => new Set(workoutDays), [workoutDays]);
  const cells = useMemo(() => {
    const start = startOfMonthGrid(month);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [month]);

  const monthTitle = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const todayKey = dayKey(now);

  return <View style={styles.chart}>
    <View style={styles.row}>
      <View style={styles.flex1}>
        <Text style={styles.routineName}>Workout streak</Text>
        <Text style={styles.sub}>Your consistency at a glance</Text>
      </View>
      <View style={styles.row}>
        <Pressable style={styles.secondary} onPress={() => setMonthOffset(value => value - 1)}><Text style={styles.secondaryText}>‹</Text></Pressable>
        <Pressable style={styles.secondary} onPress={() => setMonthOffset(0)}><Text style={styles.secondaryText}>Today</Text></Pressable>
        <Pressable style={styles.secondary} onPress={() => setMonthOffset(value => value + 1)}><Text style={styles.secondaryText}>›</Text></Pressable>
      </View>
    </View>
    <View style={styles.stats}>
      <View style={styles.stat}><Text style={styles.statValue}>{currentStreak}</Text><Text style={styles.statLabel}>Current</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{longestStreak}</Text><Text style={styles.statLabel}>Longest</Text></View>
      <View style={styles.stat}><Text style={styles.statValue}>{workoutDays.length}</Text><Text style={styles.statLabel}>Workout days</Text></View>
    </View>
    <Text style={styles.section}>{monthTitle}</Text>
    <View style={calendarStyles.week}>{DAY_LABELS.map((label, index) => <Text key={`${label}-${index}`} style={calendarStyles.weekLabel}>{label}</Text>)}</View>
    <View style={calendarStyles.grid}>
      {cells.map(date => {
        const key = dayKey(date);
        const inMonth = date.getMonth() === month.getMonth();
        const worked = workoutSet.has(key);
        const isToday = key === todayKey;
        return <View key={key} style={[calendarStyles.cell, !inMonth && calendarStyles.cellOutside]}><View style={[calendarStyles.dot, worked && calendarStyles.dotActive, isToday && calendarStyles.dotToday]}><Text style={[calendarStyles.day, worked && calendarStyles.dayActive]}>{date.getDate()}</Text></View></View>;
      })}
    </View>
    <View style={calendarStyles.legend}><View style={calendarStyles.legendItem}><View style={calendarStyles.legendDot} /><Text style={styles.miniLabel}>Rest</Text></View><View style={calendarStyles.legendItem}><View style={[calendarStyles.legendDot, calendarStyles.legendDotActive]} /><Text style={styles.miniLabel}>Workout</Text></View></View>
  </View>;
}

const calendarStyles = StyleSheet.create({
  week: { flexDirection: 'row', marginBottom: 6 },
  weekLabel: { flex: 1, textAlign: 'center', color: C.muted, fontSize: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.2857%', alignItems: 'center', paddingVertical: 4 },
  cellOutside: { opacity: 0.3 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: C.lime },
  dotToday: { borderWidth: 1, borderColor: C.lime },
  day: { color: C.text, fontSize: 12 },
  dayActive: { color: C.bg, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.panel2 },
  legendDotActive: { backgroundColor: C.lime },
});
