import type { ExerciseHistory } from './types/history';

export type Metric = 'weight' | 'reps' | 'volume' | '1rm';
export type RangeDays = 30 | 90 | 0; // 0 = all time
export type ExercisePoint = { date: number; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;

// Epley formula: estimated 1-rep max from a single logged set.
export const estimate1RM = (weightKg: number, reps: number) => weightKg * (1 + reps / 30);

export function exerciseNames(history: ExerciseHistory): string[] {
  return Object.keys(history).sort((a, b) => a.localeCompare(b));
}

export type MuscleVolume = { muscle: string; volume: number };

// Aggregates total volume per muscle group across all exercises. Entries logged before this field
// existed won't have `muscle` at runtime despite the type — fall back to 'Other' rather than crash.
export function muscleDistribution(history: ExerciseHistory, rangeDays: RangeDays): MuscleVolume[] {
  const cutoff = rangeDays ? Date.now() - rangeDays * DAY_MS : 0;
  const totals = new Map<string, number>();
  Object.values(history).forEach(entries => entries.forEach(entry => {
    const date = new Date(entry.date).getTime();
    if (date < cutoff) return;
    const muscle = entry.muscle || 'Other';
    const volume = entry.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    totals.set(muscle, (totals.get(muscle) || 0) + volume);
  }));
  return Array.from(totals.entries()).map(([muscle, volume]) => ({ muscle, volume })).sort((a, b) => b.volume - a.volume);
}

// One point per session entry that included this exercise.
// weight/reps use that entry's best set (highest estimated 1RM); volume sums all sets in that entry.
export function exerciseSeries(history: ExerciseHistory, exerciseName: string, metric: Metric, rangeDays: RangeDays): ExercisePoint[] {
  const cutoff = rangeDays ? Date.now() - rangeDays * DAY_MS : 0;
  const entries = history[exerciseName] ?? [];
  const points: ExercisePoint[] = [];
  for (const entry of entries) {
    const date = new Date(entry.date).getTime();
    if (date < cutoff || !entry.sets.length) continue;
    if (metric === 'volume') {
      points.push({ date, value: entry.sets.reduce((sum, s) => sum + s.weight * s.reps, 0) });
    } else {
      const best = entry.sets.reduce((a, b) => estimate1RM(b.weight, b.reps) > estimate1RM(a.weight, a.reps) ? b : a);
      const value = metric === 'weight' ? best.weight : metric === 'reps' ? best.reps : estimate1RM(best.weight, best.reps);
      points.push({ date, value });
    }
  }
  return points.sort((a, b) => a.date - b.date);
}
