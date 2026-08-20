import type { ExerciseHistory, ExerciseHistoryEntry, LoggedSet } from '../types/history';

const MAX_ENTRIES_PER_EXERCISE = 20;

const sortedEntries = (history: ExerciseHistory, exerciseName: string): ExerciseHistoryEntry[] =>
  [...(history[exerciseName] ?? [])].sort((a, b) => b.date.localeCompare(a.date));

const heaviestSet = (sets: LoggedSet[]): LoggedSet | null =>
  sets.reduce<LoggedSet | null>((best, set) => {
    if (!best) return set;
    if (set.weight > best.weight) return set;
    if (set.weight === best.weight && set.reps > best.reps) return set;
    return best;
  }, null);

export type ExerciseSummary = {
  last: { weight: number; reps: number } | null;
  best: { weight: number; reps: number } | null;
  lastVolume: number | null;
};

export function getExerciseSummary(history: ExerciseHistory, exerciseName: string): ExerciseSummary {
  const entries = sortedEntries(history, exerciseName);
  const latest = entries[0];
  const last = latest ? heaviestSet(latest.sets) : null;
  const best = entries.reduce<LoggedSet | null>((acc, entry) => {
    const candidate = heaviestSet(entry.sets);
    if (!candidate) return acc;
    if (!acc || candidate.weight > acc.weight || (candidate.weight === acc.weight && candidate.reps > acc.reps)) return candidate;
    return acc;
  }, null);
  const lastVolume = latest ? latest.sets.reduce((sum, s) => sum + s.weight * s.reps, 0) : null;

  return {
    last: last ? { weight: last.weight, reps: last.reps } : null,
    best: best ? { weight: best.weight, reps: best.reps } : null,
    lastVolume,
  };
}

export type PrefillValue = { weight: number; reps: number; rpe: number | null };

export function getPrefillForSet(history: ExerciseHistory, exerciseName: string, setIndex: number): PrefillValue | null {
  const latest = sortedEntries(history, exerciseName)[0];
  if (!latest || latest.sets.length === 0) return null;
  const set = latest.sets[setIndex] ?? latest.sets[latest.sets.length - 1];
  return { weight: set.weight, reps: set.reps, rpe: set.rpe };
}

export function appendHistoryEntry(history: ExerciseHistory, exerciseName: string, entry: ExerciseHistoryEntry): ExerciseHistory {
  const existing = sortedEntries(history, exerciseName);
  return { ...history, [exerciseName]: [entry, ...existing].slice(0, MAX_ENTRIES_PER_EXERCISE) };
}

export function isRoutineCompletedToday(history: ExerciseHistory, routineId: string): boolean {
  const today = new Date().toDateString();
  return Object.values(history).some(entries => entries.some(e => e.routineId === routineId && new Date(e.date).toDateString() === today));
}

export function getDailyVolumes(history: ExerciseHistory, days: number): number[] {
  const totals = new Array(days).fill(0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  Object.values(history).forEach(entries => entries.forEach(entry => {
    const entryDay = new Date(entry.date); entryDay.setHours(0, 0, 0, 0);
    const fromEnd = Math.round((today.getTime() - entryDay.getTime()) / 86400000);
    if (fromEnd >= 0 && fromEnd < days) totals[days - 1 - fromEnd] += entry.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  }));
  return totals;
}

export type VolumeGranularity = 'day' | 'week' | 'month';
export type VolumeBucket = { label: string; value: number };

const startOfWeek = (d: Date) => { const dt = new Date(d); const day = (dt.getDay() + 6) % 7; dt.setDate(dt.getDate() - day); dt.setHours(0, 0, 0, 0); return dt; };

// Buckets recent workout volume into `count` trailing periods (days, weeks starting Monday, or calendar months).
export function getVolumeBuckets(history: ExerciseHistory, granularity: VolumeGranularity, count: number): VolumeBucket[] {
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const values = new Array(count).fill(0);
  const labels = new Array(count).fill('');

  for (let i = 0; i < count; i++) {
    const offset = count - 1 - i;
    if (granularity === 'day') { const d = new Date(now); d.setDate(d.getDate() - offset); labels[i] = d.toLocaleDateString(undefined, { weekday: 'short' }); }
    else if (granularity === 'week') { const d = new Date(now); d.setDate(d.getDate() - offset * 7); labels[i] = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
    else { const d = new Date(now.getFullYear(), now.getMonth() - offset, 1); labels[i] = d.toLocaleDateString(undefined, { month: 'short' }); }
  }

  Object.values(history).forEach(entries => entries.forEach(entry => {
    const d = new Date(entry.date); d.setHours(0, 0, 0, 0);
    const volume = entry.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    let idx: number | null = null;
    if (granularity === 'day') {
      const fromEnd = Math.round((now.getTime() - d.getTime()) / 86400000);
      if (fromEnd >= 0 && fromEnd < count) idx = count - 1 - fromEnd;
    } else if (granularity === 'week') {
      const fromEnd = Math.round((startOfWeek(now).getTime() - startOfWeek(d).getTime()) / (7 * 86400000));
      if (fromEnd >= 0 && fromEnd < count) idx = count - 1 - fromEnd;
    } else {
      const fromEnd = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (fromEnd >= 0 && fromEnd < count) idx = count - 1 - fromEnd;
    }
    if (idx !== null) values[idx] += volume;
  }));

  return values.map((value, i) => ({ label: labels[i], value }));
}
