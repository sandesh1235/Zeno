import type { ExerciseHistory } from '../types/history';

const dayKey = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fromKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const previousDay = (key: string): string => {
  const d = fromKey(key);
  d.setDate(d.getDate() - 1);
  return dayKey(d);
};

export type WorkoutStreaks = {
  workoutDays: string[];
  currentStreak: number;
  longestStreak: number;
};

export function getWorkoutStreaks(history: ExerciseHistory, now = new Date()): WorkoutStreaks {
  const days = new Set<string>();
  Object.values(history).forEach(entries => entries.forEach(entry => days.add(dayKey(new Date(entry.date)))));
  const workoutDays = [...days].sort();

  let longestStreak = 0;
  let run = 0;
  let previous: string | null = null;
  workoutDays.forEach(day => {
    run = previous && previousDay(day) === previous ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = day;
  });

  const today = dayKey(now);
  let currentStreak = 0;
  let cursor = days.has(today) ? today : previousDay(today);
  while (days.has(cursor)) {
    currentStreak += 1;
    cursor = previousDay(cursor);
  }

  return { workoutDays, currentStreak, longestStreak };
}
