import { useMemo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
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

export function StreakCalendar({ history, now = new Date() }: Props) {
  const [monthOffset, setMonthOffset] = useStateMonthOffset();
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
    <View style={styles.titleRow}><Text style={styles.section}>{monthTitle}</Text></View>
    <View style={styles.streakWeek}><>{DAY_LABELS.map((label, index) => <Text key={`${label}-${index}`} style={styles.miniLabel}>{label}</Text>)}</></View>
    <View style={styles.streakGrid}>
      {cells.map(date => {
        const key = dayKey(date);
        const inMonth = date.getMonth() === month.getMonth();
        const worked = workoutSet.has(key);
        const isToday = key === todayKey;
        return <View key={key} style={[styles.streakCell, !inMonth && styles.streakCellOutside]}><View style={[styles.streakDot, worked && styles.streakDotActive, isToday && styles.streakDotToday]}><Text style={[styles.streakDay, worked && styles.streakDayActive]}>{date.getDate()}</Text></View></View>;
      })}
    </View>
    <View style={styles.row}><View style={[styles.streakLegendDot, { backgroundColor: C.panel2 }]} /><Text style={styles.miniLabel}>Rest</Text><View style={[styles.streakLegendDot, { backgroundColor: C.lime }]} /><Text style={styles.miniLabel}>Workout</Text></View>
  </View>;
}

function useStateMonthOffset(): [number, (update: number | ((value: number) => number)) => void] {
  const [value, setValue] = require('react').useState(0) as [number, (update: number | ((value: number) => number)) => void];
  return [value, setValue];
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
