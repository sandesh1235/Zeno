import type { ExerciseHistory, ExerciseHistoryEntry } from '../types/history';

export type WeeklyComparison = {
  current: { sessions: number; volume: number; sets: number };
  previous: { sessions: number; volume: number; sets: number };
};

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const weekKey = (date: Date): string => startOfWeek(date).toISOString().slice(0, 10);

export function getWeekOverWeekComparison(history: ExerciseHistory, now = new Date()): WeeklyComparison {
  const currentKey = weekKey(now);
  const previous = new Date(startOfWeek(now));
  previous.setDate(previous.getDate() - 7);
  const previousKey = weekKey(previous);

  const totals: Record<string, { sessions: Set<string>; volume: number; sets: number }> = {
    [currentKey]: { sessions: new Set(), volume: 0, sets: 0 },
    [previousKey]: { sessions: new Set(), volume: 0, sets: 0 },
  };

  Object.values(history).forEach((entries: ExerciseHistoryEntry[]) => {
    entries.forEach(entry => {
      const key = weekKey(new Date(entry.date));
      const bucket = totals[key];
      if (!bucket) return;
      bucket.sessions.add(new Date(entry.date).toDateString());
      bucket.volume += entry.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
      bucket.sets += entry.sets.length;
    });
  });

  const toResult = (key: string) => ({
    sessions: totals[key].sessions.size,
    volume: totals[key].volume,
    sets: totals[key].sets,
  });

  return { current: toResult(currentKey), previous: toResult(previousKey) };
}

export function percentageChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
