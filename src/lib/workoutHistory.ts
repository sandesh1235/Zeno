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
