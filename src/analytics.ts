import type { WorkoutLog } from './storage';

export type Metric = 'weight' | 'reps' | 'volume';
export type RangeDays = 30 | 90 | 0; // 0 = all time
export type ExercisePoint = { date: number; value: number };

const DAY_MS = 24 * 60 * 60 * 1000;

// Epley formula: estimated 1-rep max from a single logged set.
export const estimate1RM = (weightKg: number, reps: number) => weightKg * (1 + reps / 30);

export function exerciseNames(history: WorkoutLog[]): string[] {
  const names = new Set<string>();
  history.forEach(w => w.sets.forEach(s => names.add(s.exerciseName)));
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

// One point per workout session that included this exercise.
// weight/reps use that session's best set (highest estimated 1RM); volume sums all sets for the exercise that session.
export function exerciseSeries(history: WorkoutLog[], exerciseName: string, metric: Metric, rangeDays: RangeDays): ExercisePoint[] {
  const cutoff = rangeDays ? Date.now() - rangeDays * DAY_MS : 0;
  const points: ExercisePoint[] = [];
  for (const w of history) {
    if (w.completedAt < cutoff) continue;
    const sets = w.sets.filter(s => s.exerciseName === exerciseName);
    if (!sets.length) continue;
    if (metric === 'volume') {
      points.push({ date: w.completedAt, value: sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0) });
    } else {
      const best = sets.reduce((a, b) => estimate1RM(b.weightKg, b.reps) > estimate1RM(a.weightKg, a.reps) ? b : a);
      points.push({ date: w.completedAt, value: metric === 'weight' ? best.weightKg : best.reps });
    }
  }
  return points.sort((a, b) => a.date - b.date);
}
